/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as addresses from "../addresses.js";
import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as autoContributionCron from "../autoContributionCron.js";
import type * as categories from "../categories.js";
import type * as credits from "../credits.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as email from "../email.js";
import type * as expenses from "../expenses.js";
import type * as http from "../http.js";
import type * as locations from "../locations.js";
import type * as migration from "../migration.js";
import type * as monthData from "../monthData.js";
import type * as password from "../password.js";
import type * as recurring from "../recurring.js";
import type * as repairs from "../repairs.js";
import type * as savingsGoals from "../savingsGoals.js";
import type * as settlements from "../settlements.js";
import type * as users from "../users.js";
import type * as utils_activityFeed from "../utils/activityFeed.js";
import type * as utils_activityLog from "../utils/activityLog.js";
import type * as utils_auth from "../utils/auth.js";
import type * as utils_batchFetch from "../utils/batchFetch.js";
import type * as utils_calendar from "../utils/calendar.js";
import type * as utils_credit from "../utils/credit.js";
import type * as utils_creditData from "../utils/creditData.js";
import type * as utils_functions from "../utils/functions.js";
import type * as utils_html from "../utils/html.js";
import type * as utils_listActivityFeed from "../utils/listActivityFeed.js";
import type * as utils_money from "../utils/money.js";
import type * as utils_password from "../utils/password.js";
import type * as utils_publicUser from "../utils/publicUser.js";
import type * as utils_rateLimit from "../utils/rateLimit.js";
import type * as utils_settlement from "../utils/settlement.js";
import type * as utils_settlementEmail from "../utils/settlementEmail.js";
import type * as utils_settlementPlan from "../utils/settlementPlan.js";
import type * as utils_validation from "../utils/validation.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  analytics: typeof analytics;
  auth: typeof auth;
  autoContributionCron: typeof autoContributionCron;
  categories: typeof categories;
  credits: typeof credits;
  crons: typeof crons;
  documents: typeof documents;
  email: typeof email;
  expenses: typeof expenses;
  http: typeof http;
  locations: typeof locations;
  migration: typeof migration;
  monthData: typeof monthData;
  password: typeof password;
  recurring: typeof recurring;
  repairs: typeof repairs;
  savingsGoals: typeof savingsGoals;
  settlements: typeof settlements;
  users: typeof users;
  "utils/activityFeed": typeof utils_activityFeed;
  "utils/activityLog": typeof utils_activityLog;
  "utils/auth": typeof utils_auth;
  "utils/batchFetch": typeof utils_batchFetch;
  "utils/calendar": typeof utils_calendar;
  "utils/credit": typeof utils_credit;
  "utils/creditData": typeof utils_creditData;
  "utils/functions": typeof utils_functions;
  "utils/html": typeof utils_html;
  "utils/listActivityFeed": typeof utils_listActivityFeed;
  "utils/money": typeof utils_money;
  "utils/password": typeof utils_password;
  "utils/publicUser": typeof utils_publicUser;
  "utils/rateLimit": typeof utils_rateLimit;
  "utils/settlement": typeof utils_settlement;
  "utils/settlementEmail": typeof utils_settlementEmail;
  "utils/settlementPlan": typeof utils_settlementPlan;
  "utils/validation": typeof utils_validation;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
