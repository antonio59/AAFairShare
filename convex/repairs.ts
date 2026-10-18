import { internalMutation } from "./_generated/server";
import { inferAnchor, dayOf } from "./utils/calendar";

/**
 * One-off repair for dates that drifted before the anchor day was stored.
 *
 * Recurring bills: if lastGeneratedDate is a later day than nextDueDate
 * (31 January, then 28 February), the anchor is restored to 31. February
 * stays on the 28th; the following month uses the anchor. If both dates
 * are already the 28th, the original day is gone and this stores 28.
 *
 * Savings goals only have autoContributionNextDate. A goal already sitting
 * on 3 March cannot be put back on the 31st. This stores the day that is
 * currently on the row.
 *
 * Do not run this against production until the anchor-day deploy is live.
 * Command (not executed by this change):
 *   npx convex run repairs:repairDateAnchors
 */
export const repairDateAnchors = internalMutation({
  args: {},
  handler: async (ctx) => {
    const recurring = await ctx.db.query("recurring").collect();
    let recurringAnchorsSet = 0;
    for (const item of recurring) {
      if (item.anchorDay) continue;
      await ctx.db.patch(item._id, {
        anchorDay: inferAnchor(item.lastGeneratedDate, item.nextDueDate),
      });
      recurringAnchorsSet++;
    }

    const goals = await ctx.db.query("savingsGoals").collect();
    let savingsAnchorsSet = 0;
    for (const goal of goals) {
      if (goal.autoContributionAnchorDay || !goal.autoContributionNextDate) continue;
      await ctx.db.patch(goal._id, {
        autoContributionAnchorDay: dayOf(goal.autoContributionNextDate),
      });
      savingsAnchorsSet++;
    }

    return { recurringAnchorsSet, savingsAnchorsSet };
  },
});
