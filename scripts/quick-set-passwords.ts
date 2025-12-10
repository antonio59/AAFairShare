#!/usr/bin/env bun
/**
 * Quick password setup using public mutation (no dev server needed)
 * Run with: bun scripts/quick-set-passwords.ts
 */

import { execSync } from "child_process";

console.log("Quick Password Setup");
console.log("===================\n");

// User 1
const email1 = prompt("User 1 email: ");
if (!email1) {
  console.error("Email required");
  process.exit(1);
}

const password1 = prompt("User 1 password: ");
if (!password1) {
  console.error("Password required");
  process.exit(1);
}

console.log(`\nSetting password for ${email1}...`);
try {
  execSync(
    `bun x convex run password:setPassword --args '${JSON.stringify({ email: email1, password: password1 })}'`,
    { encoding: "utf-8", stdio: "inherit" }
  );
  console.log(`✓ Password set for ${email1}\n`);
} catch (err) {
  console.error(`✗ Failed to set password for ${email1}`);
  process.exit(1);
}

// User 2
const email2 = prompt("User 2 email: ");
if (!email2) {
  console.error("Email required");
  process.exit(1);
}

const password2 = prompt("User 2 password: ");
if (!password2) {
  console.error("Password required");
  process.exit(1);
}

console.log(`\nSetting password for ${email2}...`);
try {
  execSync(
    `bun x convex run password:setPassword --args '${JSON.stringify({ email: email2, password: password2 })}'`,
    { encoding: "utf-8", stdio: "inherit" }
  );
  console.log(`✓ Password set for ${email2}\n`);
} catch (err) {
  console.error(`✗ Failed to set password for ${email2}`);
  process.exit(1);
}

console.log("✓ Both passwords set successfully!\n");
console.log("You can now delete convex/passwordSetup.ts if you created it.");
