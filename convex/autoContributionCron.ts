import { internalMutation } from "./_generated/server";

function advanceDate(dateStr: string, frequency: string): string {
  const d = new Date(dateStr + "T00:00:00");
  switch (frequency) {
    case "daily": d.setDate(d.getDate() + 1); break;
    case "weekly": d.setDate(d.getDate() + 7); break;
    case "biweekly": d.setDate(d.getDate() + 14); break;
    case "monthly": d.setMonth(d.getMonth() + 1); break;
    case "quarterly": d.setMonth(d.getMonth() + 3); break;
    case "yearly": d.setFullYear(d.getFullYear() + 1); break;
    default: d.setMonth(d.getMonth() + 1); break;
  }
  return d.toISOString().split("T")[0];
}

export const generateAutoContributions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = new Date().toISOString().split("T")[0];
    const goals = await ctx.db.query("savingsGoals").collect();

    const dueGoals = goals.filter(
      (g) =>
        !g.isCompleted &&
        g.autoContributionAmount &&
        g.autoContributionAmount > 0 &&
        g.autoContributionFrequency &&
        g.autoContributionNextDate &&
        g.autoContributionNextDate <= today,
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
        date: new Date().toISOString(),
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
