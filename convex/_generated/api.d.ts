/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as cleanup from "../cleanup.js";
import type * as email from "../email.js";
import type * as expenses from "../expenses.js";
import type * as http from "../http.js";
import type * as locations from "../locations.js";
import type * as migration from "../migration.js";
import type * as monthData from "../monthData.js";
import type * as recurring from "../recurring.js";
import type * as savingsGoals from "../savingsGoals.js";
import type * as settlements from "../settlements.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  categories: typeof categories;
  cleanup: typeof cleanup;
  email: typeof email;
  expenses: typeof expenses;
  http: typeof http;
  locations: typeof locations;
  migration: typeof migration;
  monthData: typeof monthData;
  recurring: typeof recurring;
  savingsGoals: typeof savingsGoals;
  settlements: typeof settlements;
  users: typeof users;
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
