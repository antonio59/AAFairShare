import { describe, expect, it } from "bun:test";
import { hashPassword, verifyPassword } from "./password";

describe("password utilities", () => {
  it("hashes passwords", async () => {
    const password = "securePassword123";
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
    expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
  });

  it("generates different hashes for same password", async () => {
    const password = "securePassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);
    
    // Due to salt, hashes should be different
    expect(hash1).not.toBe(hash2);
  });

  it("verifies correct password", async () => {
    const password = "securePassword123";
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it("rejects incorrect password", async () => {
    const password = "securePassword123";
    const hash = await hashPassword(password);
    
    const isValid = await verifyPassword("wrongPassword", hash);
    expect(isValid).toBe(false);
  });

  it("handles empty password", async () => {
    const password = "";
    const hash = await hashPassword(password);
    
    expect(hash).toBeDefined();
    const isValid = await verifyPassword("", hash);
    expect(isValid).toBe(true);
    
    const isInvalid = await verifyPassword("notEmpty", hash);
    expect(isInvalid).toBe(false);
  });
});
