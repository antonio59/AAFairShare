import { describe, expect, it } from "bun:test";
import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { convexTest } from "convex-test";
import schema from "./schema";
import { api, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { HOUSEHOLD_BILLS_GROUP, halfPence } from "./utils/credit";
import { formatLondonDate } from "./utils/calendar";

// convex-test normally reads modules through import.meta.glob, which bun lacks.
function convexModules(): Record<string, () => Promise<unknown>> {
  const modules: Record<string, () => Promise<unknown>> = {};
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(ts|js)$/.test(entry.name) && !entry.name.includes(".test.")) {
        modules[`./${relative(import.meta.dir, path)}`] = () => import(path);
      }
    }
  };
  walk(import.meta.dir);
  return modules;
}

const modules = convexModules();
const pence = (pounds: number) => Math.round(pounds * 100);

async function household() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const antonio = await ctx.db.insert("users", { name: "Antonio", email: "a@example.com" });
    const jamie = await ctx.db.insert("users", { name: "Jamie", email: "j@example.com" });
    const energy = await ctx.db.insert("categories", { name: "Energy", group: HOUSEHOLD_BILLS_GROUP });
    const groceries = await ctx.db.insert("categories", { name: "Groceries" });
    const home = await ctx.db.insert("locations", { name: "Home" });
    return { antonio, jamie, energy, groceries, home };
  });
  const antonio = t.withIdentity({ subject: `${ids.antonio}|session-a` });
  const jamie = t.withIdentity({ subject: `${ids.jamie}|session-j` });

  const addBill = (
    who: typeof antonio,
    bill: { amount: number; date: string; paidById?: Id<"users">; category?: string; splitType?: string },
  ) =>
    who.mutation(api.expenses.addWithLookup, {
      amount: bill.amount,
      date: bill.date,
      description: `Bill ${bill.date}`,
      paidById: bill.paidById ?? ids.antonio,
      categoryName: bill.category ?? "Energy",
      locationName: "Home",
      splitType: bill.splitType ?? "50/50",
    });

  const record = (
    who: typeof antonio,
    credit: { amount: number; receivedOn: string; holderId: Id<"users">; applyToExistingBills?: boolean },
  ) =>
    who.mutation(api.credits.create, {
      ...credit,
      description: `Refund ${credit.receivedOn}`,
    });

  const allocations = () => t.run((ctx) => ctx.db.query("creditAllocations").collect());
  const onBill = async (expenseId: Id<"expenses">) =>
    (await allocations()).filter((row) => row.expenseId === expenseId);
  const settle = (month: string) =>
    antonio.mutation(api.settlements.markComplete, {
      month,
      date: `${month}-28`,
      amount: 0,
      fromUserId: ids.antonio,
      toUserId: ids.jamie,
      sendEmail: false,
    });

  return { t, ids, antonio, jamie, addBill, record, allocations, onBill, settle };
}

describe("automatic refund credit on new bills", () => {
  it("changes nothing when there are no credits", async () => {
    const h = await household();
    await h.addBill(h.antonio, { amount: 90, date: "2026-11-03" });
    expect(await h.allocations()).toEqual([]);
    const month = await h.antonio.query(api.monthData.getMonthData, { month: "2026-11" });
    expect(month.settlement).toBe(45);
    expect(month.settlementDirection).toBe("owed");
    expect(month.creditApplied).toBe(0);
    expect(month.creditLines).toEqual([]);
    expect(month.expenses[0].creditAvailable).toBe(false);
  });

  it("uses the oldest credit first, for either holder and payer", async () => {
    const h = await household();
    const older = await h.record(h.jamie, { amount: 30, receivedOn: "2026-10-01", holderId: h.ids.jamie });
    const newer = await h.record(h.antonio, { amount: 100, receivedOn: "2026-10-10", holderId: h.ids.antonio });
    const bill = await h.addBill(h.antonio, { amount: 90, date: "2026-11-03" });

    const rows = await h.onBill(bill);
    expect(rows.map((row) => [row.creditId, row.amount, row.adjustment, row.automatic])).toEqual([
      [older.creditId, 30, 15, true],
      [newer.creditId, 60, 30, true],
    ]);

    // Antonio paid £90: Jamie owes £45. Jamie's credit adds £15 to what Jamie
    // owes; Antonio's adds £30 to what Antonio owes. Jamie owes £30 net.
    const month = await h.antonio.query(api.monthData.getMonthData, { month: "2026-11" });
    expect(month.totalExpenses).toBe(90);
    expect(month.user1Paid).toBe(90);
    expect(month.creditApplied).toBe(90);
    expect(month.settlement).toBe(30);
    expect(month.settlementDirection).toBe("owed");
    expect(month.expenses[0].creditApplied).toBe(90);
    expect(month.creditLines.map((line) => [line.holderName, line.adjustment, line.automatic])).toEqual([
      ["Jamie", 15, true],
      ["Antonio", 30, true],
    ]);

    const feed = await h.antonio.query(api.expenses.getFeed, { kind: "credit" });
    expect(feed.filter((row) => row.action === "credit.applied" && row.automatic)).toHaveLength(2);
  });

  it("leaves bills that cannot use credit alone", async () => {
    const h = await household();
    await h.record(h.antonio, { amount: 500, receivedOn: "2026-10-15", holderId: h.ids.jamie });
    const closed = await h.record(h.antonio, { amount: 500, receivedOn: "2026-09-01", holderId: h.ids.jamie });
    await h.antonio.mutation(api.credits.close, { id: closed.creditId });
    await h.addBill(h.antonio, { amount: 10, date: "2026-10-01", category: "Energy", paidById: h.ids.jamie });
    await h.settle("2026-12");

    for (const bill of [
      { amount: 20, date: "2026-11-02", category: "Groceries" },
      { amount: 30, date: "2026-11-03", splitType: "custom" },
      { amount: 40, date: "2026-10-14" },
      { amount: 50, date: "2026-12-05" },
    ]) {
      await h.addBill(h.antonio, bill);
    }
    expect(await h.allocations()).toEqual([]);
  });

  it("covers bills from recurring generation, manual and scheduled", async () => {
    const h = await household();
    const today = formatLondonDate();
    await h.record(h.antonio, { amount: 1000, receivedOn: "2020-01-01", holderId: h.ids.jamie });
    const recurringId = await h.antonio.mutation(api.recurring.create, {
      amount: 12.34,
      nextDueDate: today,
      frequency: "monthly",
      description: "Water",
      userId: h.ids.antonio,
      categoryName: "Energy",
      locationName: "Home",
      splitType: "50/50",
    });
    await h.antonio.mutation(api.recurring.generateExpense, { id: recurringId });

    await h.antonio.mutation(api.recurring.create, {
      amount: 7.01,
      nextDueDate: today,
      frequency: "monthly",
      description: "Broadband",
      userId: h.ids.jamie,
      categoryName: "Energy",
      locationName: "Home",
      splitType: "50/50",
    });
    const { generated } = await h.t.mutation(internal.recurring.autoGenerateExpenses, {});
    expect(generated).toBe(1);

    const rows = await h.allocations();
    expect(rows.map((row) => [row.amount, row.automatic])).toEqual([
      [12.34, true],
      [7.01, true],
    ]);
    const cronRows = await h.t.run((ctx) =>
      ctx.db
        .query("activities")
        .filter((q) => q.eq(q.field("action"), "credit.applied"))
        .collect(),
    );
    expect(cronRows[1].actorId).toBeUndefined();
    expect(cronRows[1].automatic).toBe(true);
  });

  it("never overdraws when bills arrive at the same time", async () => {
    const h = await household();
    await h.record(h.antonio, { amount: 10, receivedOn: "2026-10-01", holderId: h.ids.jamie });
    await Promise.all(
      [1, 2, 3, 4].map((day) => h.addBill(day % 2 ? h.antonio : h.jamie, { amount: 10, date: `2026-11-0${day}` })),
    );
    const rows = await h.allocations();
    expect(rows).toHaveLength(1);
    expect(rows.reduce((total, row) => total + pence(row.amount), 0)).toBe(1000);
  });

  it("keeps cumulative pennies exact across automatic draws", async () => {
    const h = await household();
    await h.record(h.antonio, { amount: 240.01, receivedOn: "2026-10-01", holderId: h.ids.jamie });
    for (const [amount, date] of [
      [80.01, "2026-11-01"],
      [80.01, "2026-11-02"],
      [79.99, "2026-12-01"],
      [5, "2026-12-02"],
    ] as const) {
      await h.addBill(h.antonio, { amount, date });
    }
    const rows = await h.allocations();
    expect(rows.map((row) => pence(row.adjustment))).toEqual([4000, 4001, 3999]);
    expect(rows.reduce((total, row) => total + pence(row.adjustment), 0)).toBe(halfPence(24001));
  });
});

describe("manual credit actions", () => {
  it("spreads a new credit over open bills, oldest first, skipping settled months", async () => {
    const h = await household();
    const settledBill = await h.addBill(h.antonio, { amount: 40, date: "2026-10-20" });
    const novBill = await h.addBill(h.antonio, { amount: 50, date: "2026-11-05" });
    const decBill = await h.addBill(h.antonio, { amount: 50, date: "2026-12-05" });
    await h.settle("2026-10");

    const result = await h.record(h.jamie, {
      amount: 70,
      receivedOn: "2026-10-01",
      holderId: h.ids.jamie,
      applyToExistingBills: true,
    });
    expect(result).toMatchObject({ applied: 70, bills: 2 });
    expect(await h.onBill(settledBill)).toEqual([]);
    expect((await h.onBill(novBill)).map((row) => row.amount)).toEqual([50]);
    expect((await h.onBill(decBill)).map((row) => row.amount)).toEqual([20]);

    const again = await h.antonio.mutation(api.credits.applyToOpenBills, { id: result.creditId });
    expect(again).toEqual({ applied: 0, bills: 0 });
  });

  it("keeps a released bill off automation until someone adds it back", async () => {
    const h = await household();
    const { creditId } = await h.record(h.antonio, { amount: 100, receivedOn: "2026-10-01", holderId: h.ids.jamie });
    const bill = await h.addBill(h.antonio, { amount: 30, date: "2026-11-05" });
    const [row] = await h.onBill(bill);
    await h.jamie.mutation(api.credits.releaseAllocation, { id: row._id });

    expect(await h.antonio.mutation(api.credits.applyToOpenBills, { id: creditId })).toEqual({
      applied: 0,
      bills: 0,
    });
    const month = await h.antonio.query(api.monthData.getMonthData, { month: "2026-11" });
    expect(month.expenses[0].creditAvailable).toBe(true);

    expect(await h.jamie.mutation(api.credits.coverExpense, { expenseId: bill })).toEqual({ applied: 30 });
    await expect(h.jamie.mutation(api.credits.coverExpense, { expenseId: bill })).rejects.toThrow(
      "already fully covered",
    );
  });

  it("stops and resumes automatic use when a credit is closed and reopened", async () => {
    const h = await household();
    const { creditId } = await h.record(h.antonio, { amount: 100, receivedOn: "2026-10-01", holderId: h.ids.antonio });
    await h.jamie.mutation(api.credits.close, { id: creditId });
    const first = await h.addBill(h.antonio, { amount: 30, date: "2026-11-05" });
    expect(await h.onBill(first)).toEqual([]);
    await h.jamie.mutation(api.credits.reopen, { id: creditId });
    const second = await h.addBill(h.antonio, { amount: 30, date: "2026-11-06" });
    expect((await h.onBill(second)).map((row) => row.amount)).toEqual([30]);

    const balances = await h.antonio.query(api.settlements.getOpenBalances, {});
    expect(balances.heldCredits.map((held) => [held.holderName, held.remaining, held.othersShare])).toEqual([
      ["Antonio", 70, 35],
    ]);
  });

  it("refuses to move settled pennies through edits, deletes or releases", async () => {
    const h = await household();
    await h.record(h.antonio, { amount: 100, receivedOn: "2026-10-01", holderId: h.ids.jamie });
    const bill = await h.addBill(h.antonio, { amount: 60, date: "2026-11-05" });
    await h.settle("2026-11");
    const [row] = await h.onBill(bill);
    const before = await h.t.run((ctx) => ctx.db.query("settlements").first());

    await expect(h.antonio.mutation(api.expenses.update, { id: bill, amount: 20 })).rejects.toThrow(
      "Unsettle 2026-11 first",
    );
    await expect(h.antonio.mutation(api.expenses.remove, { id: bill })).rejects.toThrow("Unsettle 2026-11 first");
    await expect(h.antonio.mutation(api.credits.releaseAllocation, { id: row._id })).rejects.toThrow(
      "Unsettle 2026-11 first",
    );
    await expect(h.antonio.mutation(api.credits.coverExpense, { expenseId: bill })).rejects.toThrow(
      "Unsettle 2026-11 first",
    );

    expect(await h.onBill(bill)).toEqual([row]);
    expect(await h.t.run((ctx) => ctx.db.query("settlements").first())).toEqual(before);
  });

  it("reconciles date, category and amount edits on unsettled bills", async () => {
    const h = await household();
    await h.record(h.antonio, { amount: 100, receivedOn: "2026-10-01", holderId: h.ids.jamie });
    const bill = await h.addBill(h.antonio, { amount: 60, date: "2026-11-05" });

    await h.antonio.mutation(api.expenses.update, { id: bill, date: "2026-12-01" });
    expect((await h.onBill(bill)).map((row) => row.month)).toEqual(["2026-12"]);

    await h.antonio.mutation(api.expenses.update, { id: bill, amount: 25.01 });
    expect((await h.onBill(bill)).map((row) => [row.amount, row.adjustment])).toEqual([[25.01, 12.5]]);

    await h.antonio.mutation(api.expenses.update, { id: bill, categoryId: h.ids.groceries });
    expect(await h.onBill(bill)).toEqual([]);
  });

  it("requires a signed-in household member", async () => {
    const h = await household();
    await expect(
      h.t.mutation(api.credits.create, { amount: 10, receivedOn: "2026-10-01", holderId: h.ids.jamie }),
    ).rejects.toThrow("Not authenticated");
    const bill = await h.addBill(h.antonio, { amount: 10, date: "2026-11-01" });
    await expect(h.t.mutation(api.credits.coverExpense, { expenseId: bill })).rejects.toThrow("Not authenticated");
  });
});
