import { MutationCtx } from "../_generated/server";

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

interface RateLimitResult {
  allowed: boolean;
  remainingAttempts?: number;
  lockedUntil?: number;
}

export async function checkLoginRateLimit(
  ctx: MutationCtx,
  email: string,
): Promise<RateLimitResult> {
  const now = Date.now();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await ctx.db
    .query("loginAttempts")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .unique();

  if (!existing) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if currently locked out
  if (existing.lockedUntil && existing.lockedUntil > now) {
    return {
      allowed: false,
      lockedUntil: existing.lockedUntil,
    };
  }

  // Reset if last attempt was outside the window
  if (now - existing.lastAttempt > ATTEMPT_WINDOW_MS) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }

  // Check if max attempts reached
  if (existing.attempts >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      lockedUntil: existing.lockedUntil,
    };
  }

  return {
    allowed: true,
    remainingAttempts: MAX_ATTEMPTS - existing.attempts,
  };
}

export async function recordLoginAttempt(
  ctx: MutationCtx,
  email: string,
  success: boolean,
): Promise<void> {
  const now = Date.now();
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await ctx.db
    .query("loginAttempts")
    .withIndex("by_email", (q) => q.eq("email", normalizedEmail))
    .unique();

  if (success) {
    // Clear attempts on successful login
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return;
  }

  // Record failed attempt
  if (!existing) {
    await ctx.db.insert("loginAttempts", {
      email: normalizedEmail,
      attempts: 1,
      lastAttempt: now,
    });
    return;
  }

  // Reset if outside window
  if (now - existing.lastAttempt > ATTEMPT_WINDOW_MS) {
    await ctx.db.patch(existing._id, {
      attempts: 1,
      lastAttempt: now,
      lockedUntil: undefined,
    });
    return;
  }

  const newAttempts = existing.attempts + 1;
  const lockedUntil =
    newAttempts >= MAX_ATTEMPTS ? now + LOCKOUT_DURATION_MS : undefined;

  await ctx.db.patch(existing._id, {
    attempts: newAttempts,
    lastAttempt: now,
    lockedUntil,
  });
}
