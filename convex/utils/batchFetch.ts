import { QueryCtx } from "../_generated/server";
import { Id, Doc } from "../_generated/dataModel";

/**
 * Batch fetch multiple documents by their IDs
 * More efficient than individual db.get() calls in a loop
 */
export async function batchGetByIds<T extends keyof Doc>(
  ctx: QueryCtx,
  _table: T,
  ids: Id<T>[],
): Promise<Map<Id<T>, Doc<T> | null>> {
  const uniqueIds = [...new Set(ids)];
  const results = await Promise.all(uniqueIds.map((id) => ctx.db.get(id)));

  const map = new Map<Id<T>, Doc<T> | null>();
  uniqueIds.forEach((id, index) => {
    map.set(id, results[index]);
  });

  return map;
}

/**
 * Get all categories as a map for quick lookup
 */
export async function getCategoriesMap(
  ctx: QueryCtx,
): Promise<Map<Id<"categories">, Doc<"categories">>> {
  const categories = await ctx.db.query("categories").collect();
  const map = new Map<Id<"categories">, Doc<"categories">>();
  categories.forEach((cat) => map.set(cat._id, cat));
  return map;
}

/**
 * Get all locations as a map for quick lookup
 */
export async function getLocationsMap(
  ctx: QueryCtx,
): Promise<Map<Id<"locations">, Doc<"locations">>> {
  const locations = await ctx.db.query("locations").collect();
  const map = new Map<Id<"locations">, Doc<"locations">>();
  locations.forEach((loc) => map.set(loc._id, loc));
  return map;
}

/**
 * Get all users as a map for quick lookup
 */
export async function getUsersMap(
  ctx: QueryCtx,
): Promise<Map<Id<"users">, Doc<"users">>> {
  const users = await ctx.db.query("users").collect();
  const map = new Map<Id<"users">, Doc<"users">>();
  users.forEach((user) => map.set(user._id, user));
  return map;
}
