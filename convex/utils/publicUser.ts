/**
 * The only user shape that may leave a public query.
 * Allowlisted so a new secret column on `users` cannot leak by being spread.
 */

const SENSITIVE_USER_KEYS = [
  "passwordHash",
  "passwordUpdatedAt",
  "tokenIdentifier",
] as const;

export type SensitiveUserKey = (typeof SENSITIVE_USER_KEYS)[number];

export type PublicUser = {
  _id: string;
  _creationTime?: number;
  email?: string;
  name?: string;
  image?: string;
  emailVerificationTime?: number;
  username?: string;
  photoUrl?: string;
};

type UserLike = PublicUser & {
  passwordHash?: string;
  passwordUpdatedAt?: number;
  tokenIdentifier?: string;
};

export function toPublicUser<T extends UserLike>(user: T): PublicUser & { _id: T["_id"] } {
  return {
    _id: user._id,
    _creationTime: user._creationTime,
    email: user.email,
    name: user.name,
    image: user.image,
    emailVerificationTime: user.emailVerificationTime,
    username: user.username,
    photoUrl: user.photoUrl,
  };
}

/** Expense month rows. Always pass the payer through here, never the raw document. */
export function withPaidByUser<T extends object, U extends UserLike>(
  row: T,
  payer: U | null | undefined,
) {
  return {
    ...row,
    paidByUser: payer ? toPublicUser(payer) : null,
  };
}

/** Recurring rows. The nested `user` is the public profile only. */
export function withRecurringUser<T extends object, U extends UserLike>(
  row: T,
  user: U | null | undefined,
) {
  return {
    ...row,
    user: user ? toPublicUser(user) : null,
  };
}

/** Walk a query result. Returns the first sensitive key found, or null. */
export function findSensitiveUserField(
  value: unknown,
  seen: Set<unknown> = new Set(),
): SensitiveUserKey | null {
  if (value === null || typeof value !== "object") return null;
  if (seen.has(value)) return null;
  seen.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findSensitiveUserField(item, seen);
      if (found) return found;
    }
    return null;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if ((SENSITIVE_USER_KEYS as readonly string[]).includes(key)) {
      return key as SensitiveUserKey;
    }
    const found = findSensitiveUserField(child, seen);
    if (found) return found;
  }
  return null;
}
