import { v } from "convex/values";
import { query, mutation, action, internalAction, internalQuery, internalMutation } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { internal } from "./_generated/api";

const TRUELAYER_CLIENT_ID = process.env.TRUELAYER_CLIENT_ID;
const TRUELAYER_CLIENT_SECRET = process.env.TRUELAYER_CLIENT_SECRET;
const TRUELAYER_ENV = process.env.TRUELAYER_ENV || "sandbox";

const getTrueLayerUrls = () => {
  const isLive = TRUELAYER_ENV === "live";
  return {
    apiUrl: isLive ? "https://api.truelayer.com" : "https://api.truelayer-sandbox.com",
    authUrl: isLive ? "https://auth.truelayer.com" : "https://auth.truelayer-sandbox.com",
  };
};

// Get TrueLayer auth link for connecting a bank.
// Issues a single-use, server-side state nonce so the OAuth callback can be
// trusted — a plain base64 state would let anyone link a bank account to an
// arbitrary userId.
export const generateAuthLink = mutation({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await requireAuthenticatedUser(ctx);
      if (!TRUELAYER_CLIENT_ID) return { authUrl: null, error: "TrueLayer not configured" };

      const { authUrl } = getTrueLayerUrls();
      // Use explicitly configured redirect URI if set, otherwise compute from site URL
      const siteUrl = process.env.CONVEX_SITE_URL || process.env.SITE_URL || "http://localhost:8080";
      const redirectUri = process.env.TRUELAYER_REDIRECT_URI || `${siteUrl.replace(/\/$/, "")}/api/callback/truelayer`;

      // Single-use nonce, expires after 10 minutes (checked in exchangeCode)
      const nonce = crypto.randomUUID();
      await ctx.db.insert("oauthStates", {
        nonce,
        userId,
        createdAt: Date.now(),
      });

      const url = new URL(`${authUrl}/`);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("client_id", TRUELAYER_CLIENT_ID);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("scope", "accounts transactions offline_access");
      url.searchParams.set("state", nonce);
      url.searchParams.set("providers", "uk-cs-mock uk-ob-all"); // Mock for sandbox, all for live

      return { authUrl: url.toString(), error: null };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { authUrl: null, error: message };
    }
  },
});

// Exchange authorization code for tokens and store bank link
// Called from the unauthenticated HTTP callback, so userId comes from state
export const exchangeCode = action({
  args: { code: v.string(), state: v.string() },
  handler: async (ctx, args) => {
    if (!TRUELAYER_CLIENT_ID || !TRUELAYER_CLIENT_SECRET) {
      throw new Error("TrueLayer not configured");
    }

    // Resolve the single-use state nonce issued by generateAuthLink
    const oauthState = await ctx.runMutation(
      internal.banking.consumeOAuthState,
      { nonce: args.state },
    );
    if (!oauthState) throw new Error("Invalid or expired state");
    const userId = oauthState.userId;

    const { authUrl, apiUrl } = getTrueLayerUrls();
    const siteUrl = process.env.CONVEX_SITE_URL || process.env.SITE_URL || "http://localhost:8080";
    const redirectUri = process.env.TRUELAYER_REDIRECT_URI || `${siteUrl.replace(/\/$/, "")}/api/callback/truelayer`;

    // Exchange code for tokens
    const tokenResponse = await fetch(`${authUrl}/connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: TRUELAYER_CLIENT_ID,
        client_secret: TRUELAYER_CLIENT_SECRET,
        code: args.code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error("Failed to exchange code for tokens");
    }

    const tokens = await tokenResponse.json();

    // Get accounts
    const accountsResponse = await fetch(`${apiUrl}/data/v1/accounts`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!accountsResponse.ok) {
      throw new Error("Failed to fetch accounts");
    }

    const accountsData = await accountsResponse.json() as { results?: Array<{ account_id: string; display_name?: string; provider?: { display_name?: string } }> };
    const accounts = accountsData.results || [];

    let linked = 0;
    for (const account of accounts) {
      // Check if already linked
      const existing = await ctx.runQuery(internal.banking.findAccount, {
        userId,
        accountId: account.account_id,
      });

      if (!existing) {
        await ctx.runMutation(internal.banking.createBankLink, {
          userId,
          provider: "truelayer",
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          accountId: account.account_id,
          accountName: account.display_name || "Bank Account",
          institutionName: account.provider?.display_name || "Unknown Bank",
        });
        linked++;
      }
    }

    return { accountsLinked: linked };
  },
});

// Get linked bank accounts for current user (tokens excluded)
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
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.id, { isActive: false });
  },
});

// Permanently delete a bank account link
export const deleteAccount = mutation({
  args: {
    id: v.id("bankLinks"),
  },
  handler: async (ctx, args) => {
    const userId = await requireAuthenticatedUser(ctx);

    const link = await ctx.db.get(args.id);
    if (!link || link.userId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.delete(args.id);
  },
});

// Get banking configuration status
export const getConfig = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    const siteUrl = process.env.CONVEX_SITE_URL || process.env.SITE_URL || "http://localhost:8080";
    return {
      isConfigured: !!(TRUELAYER_CLIENT_ID && TRUELAYER_CLIENT_SECRET),
      environment: TRUELAYER_ENV,
      redirectUri: process.env.TRUELAYER_REDIRECT_URI || `${siteUrl.replace(/\/$/, "")}/api/callback/truelayer`,
      siteUrl,
    };
  },
});

// Refresh access tokens for all active bank links so they don't silently
// expire between syncs (TrueLayer access tokens are short-lived).
export const refreshAllTokens = internalAction({
  args: {},
  handler: async (ctx) => {
    if (!TRUELAYER_CLIENT_ID || !TRUELAYER_CLIENT_SECRET) {
      return { refreshed: 0, failed: 0, skipped: 0 };
    }

    const links = await ctx.runQuery(
      internal.banking.getAllActiveLinksInternal,
      {},
    );

    let refreshed = 0;
    let failed = 0;
    let skipped = 0;

    for (const link of links) {
      if (!link.refreshToken) {
        skipped++;
        continue;
      }
      try {
        const { authUrl } = getTrueLayerUrls();
        const response = await fetch(`${authUrl}/connect/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            grant_type: "refresh_token",
            client_id: TRUELAYER_CLIENT_ID,
            client_secret: TRUELAYER_CLIENT_SECRET,
            refresh_token: link.refreshToken,
          }),
        });
        if (!response.ok) {
          failed++;
          continue;
        }
        const tokens = await response.json();
        await ctx.runMutation(internal.banking.updateAccessToken, {
          id: link._id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });
        refreshed++;
      } catch {
        failed++;
      }
    }

    return { refreshed, failed, skipped };
  },
});

// ============ INTERNAL FUNCTIONS ============

// Look up an OAuth state nonce and delete it (single-use).
// Returns null if unknown or older than 10 minutes.
export const consumeOAuthState = internalMutation({
  args: { nonce: v.string() },
  handler: async (ctx, args) => {
    const state = await ctx.db
      .query("oauthStates")
      .withIndex("by_nonce", (q) => q.eq("nonce", args.nonce))
      .unique();

    if (!state) return null;

    await ctx.db.delete(state._id);

    if (Date.now() - state.createdAt > 10 * 60 * 1000) return null;

    return { userId: state.userId };
  },
});

// Find existing bank link by user + accountId
export const findAccount = internalQuery({
  args: {
    userId: v.id("users"),
    accountId: v.string(),
  },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("bankLinks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return links.find((l) => l.accountId === args.accountId) || null;
  },
});

// Create a new bank link
export const createBankLink = internalMutation({
  args: {
    userId: v.id("users"),
    provider: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accountId: v.string(),
    accountName: v.string(),
    institutionName: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("bankLinks", {
      ...args,
      isActive: true,
      lastSyncAt: undefined,
      createdAt: Date.now(),
    });
  },
});

// Get all active bank links (internal - no auth check, used by the token refresh cron)
export const getAllActiveLinksInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("bankLinks")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

// Internal query to get bank link with tokens
export const getBankLinkInternal = internalQuery({
  args: { id: v.id("bankLinks") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Update access token after refresh
export const updateAccessToken = internalMutation({
  args: {
    id: v.id("bankLinks"),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, unknown> = { accessToken: args.accessToken };
    if (args.refreshToken) updates.refreshToken = args.refreshToken;
    await ctx.db.patch(args.id, updates);
  },
});

// Update last sync time
export const updateLastSync = internalMutation({
  args: {
    id: v.id("bankLinks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { lastSyncAt: Date.now() });
  },
});
