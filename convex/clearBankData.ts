import { internalMutation } from "./_generated/server";

const BANK_SOURCES = new Set(["truelayer", "plaid"]);

/**
 * Deletes stored bank tokens and the rows that only existed for bank sync.
 *
 * Tables stay in the schema. Convex cannot drop a table that still has
 * documents in the same deploy as this mutation. Run this after the deploy
 * that removes the banking code, then a later change can remove the empty
 * tables.
 *
 * Pending transactions from other sources (manual, apple pay, and so on)
 * are left in place. Only truelayer and plaid rows are deleted.
 *
 * Not run against production. Command:
 *   npx convex run clearBankData:clearStoredBankData
 */
export const clearStoredBankData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const links = await ctx.db.query("bankLinks").collect();
    for (const row of links) await ctx.db.delete(row._id);

    const states = await ctx.db.query("oauthStates").collect();
    for (const row of states) await ctx.db.delete(row._id);

    const mappings = await ctx.db.query("merchantMappings").collect();
    for (const row of mappings) await ctx.db.delete(row._id);

    const pending = await ctx.db.query("pendingTransactions").collect();
    let pendingTransactions = 0;
    for (const row of pending) {
      if (!BANK_SOURCES.has(row.source)) continue;
      await ctx.db.delete(row._id);
      pendingTransactions++;
    }

    return {
      bankLinks: links.length,
      oauthStates: states.length,
      merchantMappings: mappings.length,
      pendingTransactions,
    };
  },
});
