import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { api } from "./_generated/api";

// TrueLayer configuration - set these in Convex dashboard environment variables
const TRUELAYER_CLIENT_ID = process.env.TRUELAYER_CLIENT_ID;
const TRUELAYER_CLIENT_SECRET = process.env.TRUELAYER_CLIENT_SECRET;
const TRUELAYER_REDIRECT_URI = process.env.TRUELAYER_REDIRECT_URI;
const TRUELAYER_ENV = process.env.TRUELAYER_ENV || "sandbox"; // "sandbox" or "live"

const getTrueLayerUrls = () => {
  const isLive = TRUELAYER_ENV === "live";
  return {
    authUrl: isLive ? "https://auth.truelayer.com" : "https://auth.truelayer-sandbox.com",
    apiUrl: isLive ? "https://api.truelayer.com" : "https://api.truelayer-sandbox.com",
  };
};

// Generate TrueLayer auth link for bank connection
export const generateAuthLink = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    if (!TRUELAYER_CLIENT_ID || !TRUELAYER_REDIRECT_URI) {
      return {
        error: "TrueLayer not configured. Add TRUELAYER_CLIENT_ID and TRUELAYER_REDIRECT_URI to environment.",
        authUrl: null,
      };
    }

    const { authUrl } = getTrueLayerUrls();
    const state = crypto.randomUUID();

    // TrueLayer OAuth URL with required scopes
    const params = new URLSearchParams({
      response_type: "code",
      client_id: TRUELAYER_CLIENT_ID,
      redirect_uri: TRUELAYER_REDIRECT_URI,
      scope: "info accounts balance transactions offline_access",
      state,
      providers: "uk-ob-all uk-oauth-all", // All UK banks
    });

    return {
      authUrl: `${authUrl}/?${params.toString()}`,
      state,
      error: null,
    };
  },
});

// Exchange auth code for tokens (called after OAuth redirect)
export const exchangeCode = action({
  args: {
    code: v.string(),
  },
  handler: async (ctx, args) => {
    if (!TRUELAYER_CLIENT_ID || !TRUELAYER_CLIENT_SECRET || !TRUELAYER_REDIRECT_URI) {
      throw new Error("TrueLayer not configured");
    }

    const { authUrl, apiUrl } = getTrueLayerUrls();

    // Exchange code for tokens
    const tokenResponse = await fetch(`${authUrl}/connect/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: TRUELAYER_CLIENT_ID,
        client_secret: TRUELAYER_CLIENT_SECRET,
        redirect_uri: TRUELAYER_REDIRECT_URI,
        code: args.code,
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await tokenResponse.json();

    // Get account info
    const accountsResponse = await fetch(`${apiUrl}/data/v1/accounts`, {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!accountsResponse.ok) {
      throw new Error("Failed to fetch accounts");
    }

    const accountsData = await accountsResponse.json();
    const accounts = accountsData.results || [];

    // Store each account as a bank link
    for (const account of accounts) {
      await ctx.runMutation(api.banking.storeBankLink, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        accountId: account.account_id,
        accountName: account.display_name || account.account_type,
        institutionName: account.provider?.display_name || "Unknown Bank",
      });
    }

    return {
      success: true,
      accountsLinked: accounts.length,
    };
  },
});

// Store bank link (internal mutation)
export const storeBankLink = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accountId: v.string(),
    accountName: v.string(),
    institutionName: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    // Check if account already linked
    const existing = await ctx.db
      .query("bankLinks")
      .withIndex("by_account", (q) => q.eq("accountId", args.accountId))
      .first();

    if (existing) {
      // Update existing link
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        isActive: true,
        lastSyncAt: Date.now(),
      });
      return existing._id;
    }

    // Create new link
    return await ctx.db.insert("bankLinks", {
      userId,
      provider: "truelayer",
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      accountId: args.accountId,
      accountName: args.accountName,
      institutionName: args.institutionName,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

// Get all linked bank accounts
export const getLinkedAccounts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthenticatedUser(ctx);

    const links = await ctx.db
      .query("bankLinks")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    // Don't expose tokens to frontend
    return links.map((link) => ({
      _id: link._id,
      accountId: link.accountId,
      accountName: link.accountName,
      institutionName: link.institutionName,
      isActive: link.isActive,
      lastSyncAt: link.lastSyncAt,
      createdAt: link.createdAt,
    }));
  },
});

// Disconnect a bank account
export const disconnectAccount = mutation({
  args: {
    id: v.id("bankLinks"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const link = await ctx.db.get(args.id);
    if (!link || link.userId !== userId) {
      throw new Error("Bank link not found");
    }

    await ctx.db.patch(args.id, { isActive: false });
  },
});

// Delete a bank account link entirely
export const deleteAccount = mutation({
  args: {
    id: v.id("bankLinks"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const link = await ctx.db.get(args.id);
    if (!link || link.userId !== userId) {
      throw new Error("Bank link not found");
    }

    await ctx.db.delete(args.id);
  },
});

// Sync transactions for a bank account
// Only imports transactions matching merchant mappings (whitelist mode)
export const syncTransactions = action({
  args: {
    bankLinkId: v.id("bankLinks"),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ created: number; skipped: number; filtered: number; total: number }> => {
    const link = await ctx.runQuery(api.banking.getBankLinkInternal, {
      id: args.bankLinkId,
    });

    if (!link || !link.isActive) {
      throw new Error("Bank link not found or inactive");
    }

    // Get merchant mappings for whitelist filtering
    const mappings = await ctx.runQuery(api.banking.getMerchantMappingsInternal, {});

    const { apiUrl } = getTrueLayerUrls();
    const daysBack = args.daysBack || 30;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - daysBack);

    // Fetch transactions
    const txResponse: Response = await fetch(
      `${apiUrl}/data/v1/accounts/${link.accountId}/transactions?from=${fromDate.toISOString()}&to=${new Date().toISOString()}`,
      {
        headers: {
          Authorization: `Bearer ${link.accessToken}`,
        },
      }
    );

    if (txResponse.status === 401) {
      // Token expired, try refresh
      if (link.refreshToken) {
        const refreshed = await refreshAccessToken(link.refreshToken);
        if (refreshed) {
          await ctx.runMutation(api.banking.updateAccessToken, {
            id: args.bankLinkId,
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
          });
          // Retry with new token
          return ctx.runAction(api.banking.syncTransactions, args);
        }
      }
      throw new Error("Token expired and refresh failed");
    }

    if (!txResponse.ok) {
      throw new Error(`Failed to fetch transactions: ${txResponse.status}`);
    }

    const txData = await txResponse.json() as { results?: Array<{ transaction_type: string; amount: number; timestamp?: string; merchant_name?: string; description?: string; transaction_id: string }> };
    const transactions = txData.results || [];

    let created = 0;
    let skipped = 0;
    let filtered = 0;

    for (const tx of transactions) {
      // Only process debits (money out)
      if (tx.transaction_type !== "DEBIT") {
        skipped++;
        continue;
      }

      const merchantName = tx.merchant_name || tx.description || "Unknown";
      const merchantLower = merchantName.toLowerCase();

      // WHITELIST MODE: Only import if merchant matches a mapping
      const matchedMapping = mappings.find((mapping) => {
        const pattern = mapping.merchantPattern.toLowerCase();
        return merchantLower.includes(pattern) || new RegExp(pattern).test(merchantLower);
      });

      if (!matchedMapping) {
        // Transaction doesn't match any allowed merchant - skip it
        filtered++;
        continue;
      }

      try {
        await ctx.runMutation(api.pendingTransactions.createFromBank, {
          amount: Math.abs(tx.amount),
          date: tx.timestamp?.split("T")[0] || new Date().toISOString().split("T")[0],
          merchantName,
          description: tx.description,
          source: "truelayer",
          externalId: tx.transaction_id,
          categoryId: matchedMapping.categoryId,
          locationId: matchedMapping.locationId,
          isUtility: matchedMapping.isUtility,
        });
        created++;
      } catch {
        // Duplicate or error, skip
        skipped++;
      }
    }

    // Update last sync time
    await ctx.runMutation(api.banking.updateLastSync, {
      id: args.bankLinkId,
    });

    return { created, skipped, filtered, total: transactions.length };
  },
});

// Internal query to get merchant mappings for sync action
export const getMerchantMappingsInternal = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("merchantMappings").collect();
  },
});

// Internal query to get bank link with tokens
export const getBankLinkInternal = query({
  args: { id: v.id("bankLinks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update access token after refresh
export const updateAccessToken = mutation({
  args: {
    id: v.id("bankLinks"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
    });
  },
});

// Update last sync timestamp
export const updateLastSync = mutation({
  args: { id: v.id("bankLinks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastSyncAt: Date.now() });
  },
});

// Helper to refresh access token
async function refreshAccessToken(refreshToken: string) {
  if (!TRUELAYER_CLIENT_ID || !TRUELAYER_CLIENT_SECRET) {
    return null;
  }

  const { authUrl } = getTrueLayerUrls();

  const response = await fetch(`${authUrl}/connect/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: TRUELAYER_CLIENT_ID,
      client_secret: TRUELAYER_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

// Check if TrueLayer is configured
export const getConfig = query({
  args: {},
  handler: async () => {
    return {
      isConfigured: !!(TRUELAYER_CLIENT_ID && TRUELAYER_CLIENT_SECRET && TRUELAYER_REDIRECT_URI),
      environment: TRUELAYER_ENV,
    };
  },
});
