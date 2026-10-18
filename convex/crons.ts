import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "auto-generate-recurring-expenses",
  { hourUTC: 6, minuteUTC: 0 },
  internal.recurring.autoGenerateExpenses,
  {},
);

crons.daily(
  "auto-generate-savings-contributions",
  { hourUTC: 6, minuteUTC: 30 },
  internal.autoContributionCron.generateAutoContributions,
  {},
);

crons.daily(
  "purge-stale-login-attempts",
  { hourUTC: 4, minuteUTC: 0 },
  internal.utils.rateLimit.purgeStaleLoginAttempts,
  {},
);

export default crons;
