import { v } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { api, internal } from "./_generated/api";

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

async function refreshAccessToken(refreshToken: string) {
  if (!TRUELAYER_CLIENT_ID || !TRUELAYER_CLIENT_SECRET) return null;
  const { authUrl } = getTrueLayerUrls();
  const response = await fetch(`${authUrl}/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: TRUELAYER_CLIENT_ID,
      client_secret: TRUELAYER_CLIENT_SECRET,
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) return null;
  return response.json();
}

// Auto-categorize a transaction based on description patterns
function categorizeTransaction(
  categories: Array<{ name: string; patterns: string[] }>,
  description: string,
): string | undefined {
  const descLower = description.toLowerCase();
  for (const cat of categories) {
    for (const pattern of cat.patterns) {
      if (descLower.includes(pattern.toLowerCase())) {
        return cat.name;
      }
    }
  }
  return undefined;
}

// Sync transactions from a bank account into holidayTransactions
export const syncTransactions = action({
  args: {
    bankLinkId: v.id("bankLinks"),
    daysBack: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{ imported: number; skipped: number; total: number }> => {
    try {
      const userId = await requireAuthenticatedUser(ctx);

      const link = await ctx.runQuery(internal.banking.getBankLinkInternal, { id: args.bankLinkId });
      if (!link || !link.isActive) throw new Error("Bank link not found or inactive");
      if (link.userId !== userId) throw new Error("Not authorized");

      const { apiUrl } = getTrueLayerUrls();
      const daysBack = args.daysBack || 90;
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - daysBack);
      const fromIso = fromDate.toISOString().split("T")[0];
      const toIso = new Date().toISOString().split("T")[0];

      let txResponse: Response;
      try {
        txResponse = await fetch(
          `${apiUrl}/data/v1/accounts/${encodeURIComponent(link.accountId)}/transactions?from=${fromIso}&to=${toIso}`,
          { headers: { Authorization: `Bearer ${link.accessToken}` } },
        );
      } catch (networkErr) {
        throw new Error(`Network error calling TrueLayer: ${networkErr instanceof Error ? networkErr.message : String(networkErr)}`, { cause: networkErr });
      }

      if (txResponse.status === 401) {
        if (!link.refreshToken) {
          throw new Error("Access token expired and no refresh token is stored. Please unlink and reconnect your bank account.");
        }
        const refreshed = await refreshAccessToken(link.refreshToken);
        if (refreshed) {
          await ctx.runMutation(internal.banking.updateAccessToken, {
            id: args.bankLinkId,
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
          });
          return ctx.runAction(api.holidays.syncTransactions, args);
        }
        throw new Error("Token expired and refresh failed. Please unlink and reconnect your bank account.");
      }

      if (!txResponse.ok) {
        let body = "";
        try { body = await txResponse.text(); } catch { /* ignore */ }
        throw new Error(`TrueLayer API error ${txResponse.status}: ${body.slice(0, 200)}`);
      }

      let txData: { results?: Array<{
        transaction_type: string;
        amount: number;
        currency: string;
        timestamp?: string;
        merchant_name?: string;
        description?: string;
        transaction_id: string;
      }> };
      try {
        txData = await txResponse.json();
      } catch (parseErr) {
        throw new Error(`Failed to parse TrueLayer response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`, { cause: parseErr });
      }
      const transactions = txData.results || [];

      let imported = 0;
      let skipped = 0;

      const categories = await ctx.runQuery(api.holidays.getCategories, {});

      for (const tx of transactions) {
        if (tx.transaction_type !== "DEBIT") {
          skipped++;
          continue;
        }

        const description = tx.merchant_name || tx.description || "Unknown";
        const date = tx.timestamp ? tx.timestamp.split("T")[0] : new Date().toISOString().split("T")[0];
        const category = categorizeTransaction(categories || [], description);

        try {
          await ctx.runMutation(internal.holidays.upsertTransaction, {
            bankLinkId: args.bankLinkId,
            externalId: tx.transaction_id,
            date,
            description,
            amount: Math.abs(tx.amount),
            currency: tx.currency || "GBP",
            category,
          });
          imported++;
        } catch {
          skipped++;
        }
      }

      await ctx.runMutation(internal.banking.updateLastSync, { id: args.bankLinkId });

      return { imported, skipped, total: transactions.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Sync failed: ${message}`, { cause: err });
    }
  },
});

// Upsert a holiday transaction (internal)
export const upsertTransaction = internalMutation({
  args: {
    bankLinkId: v.id("bankLinks"),
    externalId: v.string(),
    date: v.string(),
    description: v.string(),
    amount: v.number(),
    currency: v.string(),
    category: v.optional(v.string()),
    localAmount: v.optional(v.number()),
    localCurrency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("holidayTransactions")
      .withIndex("by_externalId", (q) => q.eq("externalId", args.externalId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        date: args.date,
        description: args.description,
        amount: args.amount,
        currency: args.currency,
        category: args.category,
        localAmount: args.localAmount,
        localCurrency: args.localCurrency,
        syncedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("holidayTransactions", {
        ...args,
        syncedAt: Date.now(),
      });
    }
  },
});

// Get all holiday transactions for a bank link, optionally filtered by date range
export const getTransactions = query({
  args: {
    bankLinkId: v.id("bankLinks"),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const link = await ctx.db.get(args.bankLinkId);
    if (!link) return [];

    let txs = await ctx.db
      .query("holidayTransactions")
      .withIndex("by_bankLink", (q) => q.eq("bankLinkId", args.bankLinkId))
      .order("desc")
      .collect();

    if (args.from) {
      txs = txs.filter((t) => t.date >= args.from!);
    }
    if (args.to) {
      txs = txs.filter((t) => t.date <= args.to!);
    }

    return txs;
  },
});

// Get analytics for holiday transactions, optionally filtered by date range
export const getAnalytics = query({
  args: {
    bankLinkId: v.id("bankLinks"),
    from: v.optional(v.string()),
    to: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const link = await ctx.db.get(args.bankLinkId);
    if (!link) return null;

    let txs = await ctx.db
      .query("holidayTransactions")
      .withIndex("by_bankLink", (q) => q.eq("bankLinkId", args.bankLinkId))
      .collect();

    if (args.from) {
      txs = txs.filter((t) => t.date >= args.from!);
    }
    if (args.to) {
      txs = txs.filter((t) => t.date <= args.to!);
    }

    if (txs.length === 0) return null;

    const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const count = txs.length;

    const dates = txs.map((tx) => tx.date).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    const dayCount = firstDate && lastDate
      ? Math.max(1, Math.ceil((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;

    const byCategory: Record<string, number> = {};
    for (const tx of txs) {
      const cat = tx.category || "Uncategorized";
      byCategory[cat] = (byCategory[cat] || 0) + tx.amount;
    }

    return {
      total,
      count,
      dailyAverage: total / dayCount,
      dateRange: { from: firstDate, to: lastDate },
      byCategory: Object.entries(byCategory)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount),
    };
  },
});

// Update a holiday transaction (category, notes, local currency)
export const updateTransaction = mutation({
  args: {
    id: v.id("holidayTransactions"),
    category: v.optional(v.string()),
    notes: v.optional(v.string()),
    localAmount: v.optional(v.number()),
    localCurrency: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    await ctx.db.patch(id, filtered);
  },
});

// Delete all holiday transactions for a bank link (useful for re-sync)
export const clearTransactions = mutation({
  args: {
    bankLinkId: v.id("bankLinks"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);

    const txs = await ctx.db
      .query("holidayTransactions")
      .withIndex("by_bankLink", (q) => q.eq("bankLinkId", args.bankLinkId))
      .collect();

    for (const tx of txs) {
      await ctx.db.delete(tx._id);
    }

    return { deleted: txs.length };
  },
});

// ============ CATEGORY CRUD ============

export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db.query("holidayCategories").order("asc").collect();
  },
});

export const createCategory = mutation({
  args: {
    name: v.string(),
    patterns: v.array(v.string()),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    return await ctx.db.insert("holidayCategories", args);
  },
});

export const updateCategory = mutation({
  args: {
    id: v.id("holidayCategories"),
    name: v.optional(v.string()),
    patterns: v.optional(v.array(v.string())),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    const { id, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    await ctx.db.patch(id, filtered);
  },
});

export const deleteCategory = mutation({
  args: { id: v.id("holidayCategories") },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx);
    await ctx.db.delete(args.id);
  },
});

export const seedDefaultCategories = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx);

    const existing = await ctx.db.query("holidayCategories").collect();
    if (existing.length > 0) return { created: 0 };

    const defaults = [
      { name: "Travel", patterns: ["iberia", "british airways", "airline", "easyjet", "ryanair", "jet2", "emirates", "qatar", "lufthansa", "air france", "delta", "united", "american airlines", "virgin atlantic"], color: "hsl(220, 70%, 50%)" },
      { name: "Accommodation", patterns: ["hotel", "airbnb", "booking.com", "expedia", "hostel", "vrbo", "hilton", "marriott", "premier inn", "holiday inn"], color: "hsl(280, 70%, 50%)" },
      { name: "Food & Drink", patterns: ["restaurant", "cafe", "coffee", "starbucks", "mcdonald", "kfc", "pizza", "sushi", "nando", "wagamama", "pub", "bar"], color: "hsl(30, 80%, 50%)" },
      { name: "Transport", patterns: ["uber", "taxi", "train", "rail", "bus", "metro", "tube", "tfl", "national express", "eurostar"], color: "hsl(160, 70%, 40%)" },
      { name: "Activities", patterns: ["tour", "museum", "attraction", "ticket", "excursion", "spa", "golf", "ski", "diving"], color: "hsl(340, 70%, 50%)" },
      { name: "Shopping", patterns: ["supermarket", "grocery", "mall", "retail", "shop", " Boots ", "sainsbury", "tesco", "asda", "waitrose", "marks & spencer"], color: "hsl(45, 90%, 45%)" },
    ];

    let created = 0;
    for (const cat of defaults) {
      await ctx.db.insert("holidayCategories", cat);
      created++;
    }
    return { created };
  },
});
