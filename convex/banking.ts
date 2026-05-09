import { v } from "convex/values";
import { query, mutation, action, internalQuery, internalMutation } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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

// Get TrueLayer auth link for connecting a bank
export const generateAuthLink = query({
  args: {},
  handler: async (ctx) => {
    const userId = await requireAuthenticatedUser(ctx);
    if (!TRUELAYER_CLIENT_ID) return { authUrl: null, error: "TrueLayer not configured" };

    const { authUrl } = getTrueLayerUrls();
    // TrueLayer OAuth callback must hit the Convex site URL, not the custom domain
    const convexSiteUrl = process.env.CONVEX_SITE_URL || "http://localhost:8080";
    const redirectUri = `${convexSiteUrl}/api/callback/truelayer`;

    const state = Buffer.from(JSON.stringify({ userId, timestamp: Date.now() })).toString("base64");

    const url = new URL(`${authUrl}/`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", TRUELAYER_CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "accounts transactions");
    url.searchParams.set("state", state);
    url.searchParams.set("providers", "uk-cs-mock uk-ob-all"); // Mock for sandbox, all for live

    return { authUrl: url.toString(), error: null };
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

    // Decode state to get userId (set in generateAuthLink)
    let userId: Id<"users">;
    try {
      const decoded = JSON.parse(Buffer.from(args.state, "base64").toString("utf8")) as { userId: string; timestamp: number };
      if (!decoded.userId || !decoded.timestamp) throw new Error("Invalid state");
      // State expires after 10 minutes
      if (Date.now() - decoded.timestamp > 10 * 60 * 1000) throw new Error("State expired");
      userId = decoded.userId as Id<"users">;
    } catch {
      throw new Error("Invalid or expired state");
    }

    const { authUrl, apiUrl } = getTrueLayerUrls();
    // TrueLayer OAuth callback must hit the Convex site URL, not the custom domain
    const convexSiteUrl = process.env.CONVEX_SITE_URL || "http://localhost:8080";
    const redirectUri = `${convexSiteUrl}/api/callback/truelayer`;

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
  handler: async () => {
    const convexSiteUrl = process.env.CONVEX_SITE_URL || "http://localhost:8080";
    const siteUrl = process.env.SITE_URL || convexSiteUrl;
    return {
      isConfigured: !!(TRUELAYER_CLIENT_ID && TRUELAYER_CLIENT_SECRET),
      environment: TRUELAYER_ENV,
      redirectUri: `${convexSiteUrl}/api/callback/truelayer`,
      siteUrl,
    };
  },
});

// ============ INTERNAL FUNCTIONS ============

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
