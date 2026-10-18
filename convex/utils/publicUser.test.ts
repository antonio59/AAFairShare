import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  findSensitiveUserField,
  toPublicUser,
  withPaidByUser,
  withRecurringUser,
} from "./publicUser";

const secretUser = {
  _id: "user_antonio",
  _creationTime: 1,
  email: "antonio@example.com",
  name: "Antonio",
  username: "antonio",
  image: "https://example.com/a.png",
  photoUrl: "https://example.com/a.png",
  emailVerificationTime: 123,
  passwordHash: "$2a$10$should-never-leave-the-server",
  passwordUpdatedAt: 1_700_000_000_000,
  tokenIdentifier: "migration:legacy-token",
};

describe("toPublicUser", () => {
  it("keeps profile fields and drops every credential field", () => {
    const pub = toPublicUser(secretUser);
    expect(pub).toEqual({
      _id: "user_antonio",
      _creationTime: 1,
      email: "antonio@example.com",
      name: "Antonio",
      username: "antonio",
      image: "https://example.com/a.png",
      photoUrl: "https://example.com/a.png",
      emailVerificationTime: 123,
    });
    expect(pub).not.toHaveProperty("passwordHash");
    expect(pub).not.toHaveProperty("passwordUpdatedAt");
    expect(pub).not.toHaveProperty("tokenIdentifier");
    expect(JSON.stringify(pub)).not.toContain("should-never-leave-the-server");
    expect(JSON.stringify(pub)).not.toContain("legacy-token");
  });
});

describe("joined query results", () => {
  it("expense and recurring payloads contain no passwordHash", () => {
    const expenseRow = withPaidByUser(
      {
        _id: "exp1",
        amount: 12.5,
        description: "Groceries",
        paidById: secretUser._id,
      },
      secretUser,
    );
    const recurringRow = withRecurringUser(
      {
        _id: "rec1",
        amount: 40,
        description: "Rent",
        userId: secretUser._id,
      },
      secretUser,
    );
    const userList = [toPublicUser(secretUser), toPublicUser({ ...secretUser, _id: "user_sam" })];
    const nested = { month: { expenses: [expenseRow], recurring: [recurringRow], users: userList } };

    for (const payload of [expenseRow, recurringRow, userList, nested]) {
      expect(findSensitiveUserField(payload)).toBeNull();
      expect(JSON.stringify(payload)).not.toContain("passwordHash");
      expect(JSON.stringify(payload)).not.toContain("should-never-leave-the-server");
      expect(JSON.stringify(payload)).not.toContain("tokenIdentifier");
    }

    expect(expenseRow.paidByUser?.name).toBe("Antonio");
    expect(recurringRow.user?.email).toBe("antonio@example.com");
  });

  it("still flags a raw user document if one is nested by mistake", () => {
    expect(findSensitiveUserField({ paidByUser: secretUser })).toBe("passwordHash");
  });
});

describe("query modules use the sanitiser", () => {
  const root = join(import.meta.dir, "..");

  it("getUsersMap and the joining queries go through toPublicUser", () => {
    const batch = readFileSync(join(root, "utils/batchFetch.ts"), "utf8");
    const expenses = readFileSync(join(root, "expenses.ts"), "utf8");
    const recurring = readFileSync(join(root, "recurring.ts"), "utf8");
    const users = readFileSync(join(root, "users.ts"), "utf8");

    expect(batch).toContain("toPublicUser");
    expect(expenses).toContain("withPaidByUser");
    expect(recurring).toContain("withRecurringUser");
    expect(users).toContain("toPublicUser");
    expect(expenses).not.toContain("passwordHash");
    expect(recurring).not.toContain("passwordHash");
  });
});
