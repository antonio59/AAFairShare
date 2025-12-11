import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt (sync version for Convex compatibility)
 * @param password Plaintext password
 * @returns Hashed password string
 */
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash (sync version for Convex compatibility)
 * @param password Plaintext password to check
 * @param hash Stored hash
 * @returns True if password matches hash
 */
export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}
