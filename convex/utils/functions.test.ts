import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  PROTECTED_DELETE_MESSAGE,
  PROTECTED_TABLES,
  guardHouseholdDeletes,
} from "./functions";

function fakeDb() {
  const deleted: unknown[][] = [];
  const db = {
    deleted,
    async delete(...args: unknown[]) {
      deleted.push(args);
    },
    normalizeId(table: string, id: string) {
      return id.startsWith(`${table}:`) ? id : null;
    },
    async get(id: string) {
      return { _id: id, owner: this === db };
    },
  };
  return db;
}

describe("guardHouseholdDeletes", () => {
  it.each([...PROTECTED_TABLES])("refuses to delete a row from %s by id or by table", async (table) => {
    const db = fakeDb();
    const guarded = guardHouseholdDeletes(db as never) as unknown as ReturnType<typeof fakeDb>;
    await expect(guarded.delete(`${table}:1`)).rejects.toThrow(PROTECTED_DELETE_MESSAGE);
    await expect(guarded.delete(table, `${table}:1`)).rejects.toThrow(PROTECTED_DELETE_MESSAGE);
    expect(db.deleted).toEqual([]);
  });

  it("still deletes other rows and keeps the rest of the database working", async () => {
    const db = fakeDb();
    const guarded = guardHouseholdDeletes(db as never) as unknown as ReturnType<typeof fakeDb>;
    await guarded.delete("authSessions:1");
    await guarded.delete("expenses", "expenses:2");
    expect(db.deleted).toEqual([["authSessions:1"], ["expenses", "expenses:2"]]);
    expect(await guarded.get("expenses:3")).toEqual({ _id: "expenses:3", owner: true });
  });
});

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === "_generated" || name === "node_modules") return [];
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith(".ts") && !path.endsWith(".test.ts") ? [path] : [];
  });
}

describe("household invariant in the backend source", () => {
  const convexDir = join(import.meta.dir, "..");
  const files = sourceFiles(convexDir);

  it("builds every mutation through the guarded builders", () => {
    const raw = files.filter((path) => {
      if (path.endsWith(join("utils", "functions.ts"))) return false;
      const source = readFileSync(path, "utf8");
      return /import\s*\{[^}]*\b(mutation|internalMutation)\b[^}]*\}\s*from\s*"\.{1,2}\/_generated\/server"/.test(source) ||
        /\b(mutationGeneric|internalMutationGeneric)\b/.test(source);
    });
    expect(raw).toEqual([]);
  });

  it("has no function that deletes a person", () => {
    const offenders = files.filter((path) =>
      /\.delete\(\s*(args\.)?userId\b|deleteDuplicateUser|\.delete\(\s*"users"/.test(readFileSync(path, "utf8")),
    );
    expect(offenders).toEqual([]);
  });
});
