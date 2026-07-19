import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "auto-generate-recurring-expenses",
  { hourUTC: 6, minuteUTC: 0 },
  internal.recurring.autoGenerateExpenses,
  {},
);

crons.weekly(
  "refresh-bank-tokens",
  { dayOfWeek: "monday", hourUTC: 5, minuteUTC: 0 },
  internal.banking.refreshAllTokens,
  {},
);

crons.daily(
  "auto-generate-savings-contributions",
  { hourUTC: 6, minuteUTC: 30 },
  internal.autoContributionCron.generateAutoContributions,
  {},
);

export default crons;
