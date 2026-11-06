import {
  internalMutation as rawInternalMutation,
  mutation as rawMutation,
} from "../_generated/server";

/**
 * AAFairShare is a fixed two-person household. The first two users are
 * user1 and user2 in every balance, and settlements, expenses and credits
 * point at them, so neither person, nor the account they sign in with, is
 * ever deleted. Every app mutation is built from the wrappers below, whose
 * database refuses those deletes.
 */
export const PROTECTED_TABLES = ["users", "authAccounts"] as const;

export const PROTECTED_DELETE_MESSAGE =
  "People in this household and their sign-in accounts cannot be deleted";

interface DeletingDatabase {
  delete(...args: never[]): Promise<void>;
  normalizeId(tableName: never, id: string): unknown;
}

function protectedTable(db: DeletingDatabase, args: unknown[]): string | undefined {
  const [first] = args;
  if (args.length >= 2) {
    return PROTECTED_TABLES.find((table) => table === first);
  }
  if (typeof first !== "string") return undefined;
  return PROTECTED_TABLES.find(
    (table) => (db.normalizeId as (t: string, id: string) => unknown)(table, first) !== null,
  );
}

/** A database writer that throws instead of deleting a person or their account. */
export function guardHouseholdDeletes<Db extends DeletingDatabase>(db: Db): Db {
  return new Proxy(db, {
    get(target, prop) {
      if (prop === "delete") {
        return async (...args: unknown[]) => {
          if (protectedTable(target, args)) throw new Error(PROTECTED_DELETE_MESSAGE);
          return (target.delete as (...rest: unknown[]) => Promise<void>)(...args);
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}

type Handler = (ctx: { db: DeletingDatabase }, args: unknown) => unknown;

function withHouseholdGuard<Builder>(builder: Builder): Builder {
  return ((definition: Handler | { handler: Handler }) => {
    const spec = typeof definition === "function" ? { handler: definition } : definition;
    return (builder as (spec: { handler: Handler }) => unknown)({
      ...spec,
      handler: (ctx, args) => spec.handler({ ...ctx, db: guardHouseholdDeletes(ctx.db) }, args),
    });
  }) as Builder;
}

export const mutation = withHouseholdGuard(rawMutation);
export const internalMutation = withHouseholdGuard(rawInternalMutation);
