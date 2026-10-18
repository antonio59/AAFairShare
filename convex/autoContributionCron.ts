import { internalMutation } from "./_generated/server";
import { recordActivity } from "./utils/activityLog";
import { advanceDate, dayOf, formatLondonDate } from "./utils/calendar";

const CATCH_UP_CAP = 24;

export const generateAutoContributions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const today = formatLondonDate();
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
        g.autoContributionFrequency &&
        g.autoContributionNextDate,
    );

    const users = await ctx.db.query("users").order("asc").collect();
    if (users.length === 0) return { generated: 0 };
    const fallbackContributorId = users[0]._id;

    let generated = 0;

    for (const goal of dueGoals) {
      const contributorId =
        goal.autoContributionContributorId ?? fallbackContributorId;
      if (!goal.autoContributionAmount || !goal.autoContributionFrequency || !goal.autoContributionNextDate) {
        continue;
      }

      const anchor = goal.autoContributionAnchorDay ?? dayOf(goal.autoContributionNextDate);
      let cursor = goal.autoContributionNextDate;
      let made = 0;
      while (cursor <= today && made < CATCH_UP_CAP) {
        const contributionId = await ctx.db.insert("savingsContributions", {
          goalId: goal._id,
          amount: goal.autoContributionAmount,
          contributorId,
          date: cursor,
          note: `Auto-recurring ${goal.autoContributionFrequency}`,
        });
        await recordActivity(ctx, {
          action: "goal.contribution",
          amount: goal.autoContributionAmount,
          description: goal.name,
          goalId: goal._id,
          contributionId,
          automatic: true,
        });
        cursor = advanceDate(cursor, goal.autoContributionFrequency, anchor);
        made++;
      }

      if (made === 0) continue;
      await ctx.db.patch(goal._id, {
        currentAmount: goal.currentAmount + goal.autoContributionAmount * made,
        autoContributionNextDate: cursor,
        autoContributionAnchorDay: anchor,
      });
      generated += made;
    }

    return { generated };
  },
});
