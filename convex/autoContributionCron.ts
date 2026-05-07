import { internalMutation } from "./_generated/server";

function advanceDate(dateStr: string, frequency: string): string {
  // Parse and manipulate in UTC to avoid timezone drift
  const d = new Date(dateStr + "T00:00:00Z");
  switch (frequency) {
    case "daily": d.setUTCDate(d.getUTCDate() + 1); break;
    case "weekly": d.setUTCDate(d.getUTCDate() + 7); break;
    case "biweekly": d.setUTCDate(d.getUTCDate() + 14); break;
    case "monthly": d.setUTCMonth(d.getUTCMonth() + 1); break;
    case "quarterly": d.setUTCMonth(d.getUTCMonth() + 3); break;
    case "yearly": d.setUTCFullYear(d.getUTCFullYear() + 1); break;
    default: d.setUTCMonth(d.getUTCMonth() + 1); break;
  }
  return d.toISOString().split("T")[0];
}

export const generateAutoContributions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const goals = await ctx.db
      .query("savingsGoals")
      .withIndex("by_auto_contribution_next_date", (q) =>
        q.lte("autoContributionNextDate", today),
      )
      .collect();

    const dueGoals = goals.filter(
      (g) =>
        !g.isCompleted &&
        g.autoContributionAmount &&
        g.autoContributionAmount > 0 &&
        g.autoContributionFrequency,
    );

    const users = await ctx.db.query("users").order("asc").collect();
    if (users.length === 0) return { generated: 0 };
    const contributorId = users[0]._id;

    for (const goal of dueGoals) {
      if (!goal.autoContributionAmount || !goal.autoContributionFrequency || !goal.autoContributionNextDate) {
        continue;
      }

      const nextDate = advanceDate(goal.autoContributionNextDate, goal.autoContributionFrequency);

      await ctx.db.insert("savingsContributions", {
        goalId: goal._id,
        amount: goal.autoContributionAmount,
        contributorId,
        date: today,
        note: `Auto-recurring ${goal.autoContributionFrequency}`,
      });

      await ctx.db.patch(goal._id, {
        currentAmount: goal.currentAmount + goal.autoContributionAmount,
        autoContributionNextDate: nextDate,
      });
    }

    return { generated: dueGoals.length };
  },
});
