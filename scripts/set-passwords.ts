#!/usr/bin/env bun
/**
 * Interactive script to bootstrap passwords for both household users.
 * Run with: bun scripts/set-passwords.ts
 * 
 * This script prompts for each user's email and password, hashes them,
 * and updates the Convex database. Only works in local development.
 */

import { execSync } from "child_process";
import * as readline from "readline";

// Check if we're running against local Convex
function ensureLocalEnvironment() {
  try {
    const output = execSync("bun x convex env get CONVEX_URL || echo ''", { 
      encoding: "utf-8",
      stdio: "pipe" 
    });
    
    const convexUrl = output.trim();
    
    // If no explicit CONVEX_URL is set, convex dev uses localhost
    if (!convexUrl || convexUrl.includes("localhost") || convexUrl.includes("127.0.0.1")) {
      console.log("✓ Running against local Convex development environment\n");
      return;
    }
    
    console.error("❌ ERROR: This script can only be run against a LOCAL Convex development environment.");
    console.error(`Current CONVEX_URL: ${convexUrl}`);
    console.error("\nPlease run 'convex dev' in a separate terminal and try again.");
    process.exit(1);
  } catch (err) {
    // If convex CLI isn't available or env get fails, assume local dev
    console.log("⚠ Warning: Could not verify environment. Proceeding with local assumption.\n");
  }
}

// Create readline interface for prompting
function createPrompt() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Prompt for input with optional hidden input for passwords
async function prompt(question: string, hidden = false): Promise<string> {
  const rl = createPrompt();
  
  return new Promise((resolve) => {
    if (hidden) {
      // Hide input for passwords
      const stdin = process.stdin;
      stdin.setRawMode?.(true);
      
      let input = "";
      process.stdout.write(question);
      
      stdin.on("data", (char) => {
        const key = char.toString();
        
        if (key === "\n" || key === "\r" || key === "\u0004") {
          // Enter or Ctrl+D
          stdin.setRawMode?.(false);
          stdin.pause();
          process.stdout.write("\n");
          rl.close();
          resolve(input);
        } else if (key === "\u0003") {
          // Ctrl+C
          process.exit(0);
        } else if (key === "\u007f" || key === "\b") {
          // Backspace
          if (input.length > 0) {
            input = input.slice(0, -1);
            process.stdout.write("\b \b");
          }
        } else if (key.charCodeAt(0) >= 32) {
          // Printable character
          input += key;
          process.stdout.write("*");
        }
      });
    } else {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

// Set password for a user via Convex internal mutation
async function setPassword(email: string, password: string): Promise<boolean> {
  try {
    const command = `bun x convex run password:setPassword --args '${JSON.stringify({ email, password })}'`;
    execSync(command, { encoding: "utf-8", stdio: "pipe" });
    return true;
  } catch (err: unknown) {
    const error = err as { stdout?: Buffer | string; stderr?: Buffer | string; message: string };
    console.error(`\n❌ Failed to set password for ${email}:`);
    if (error.stderr) {
      const stderr = error.stderr.toString();
      if (stderr.includes("User not found")) {
        console.error(`   User with email "${email}" does not exist in the database.`);
      } else {
        console.error(`   ${stderr}`);
      }
    }
    return false;
  }
}

// Main script
async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  AAFairShare - Bootstrap User Passwords                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  // Ensure we're running locally
  ensureLocalEnvironment();
  
  console.log("This script will set passwords for both household users.");
  console.log("Make sure the users already exist in your Convex database.\n");
  
  const results: Array<{ email: string; success: boolean }> = [];
  
  // Get credentials for User 1
  console.log("═══ User 1 ═══");
  const email1 = await prompt("Email: ");
  if (!email1) {
    console.error("Email cannot be empty.");
    process.exit(1);
  }
  
  const password1 = await prompt("Password: ", true);
  if (!password1) {
    console.error("Password cannot be empty.");
    process.exit(1);
  }
  
  const confirmPassword1 = await prompt("Confirm password: ", true);
  if (password1 !== confirmPassword1) {
    console.error("❌ Passwords do not match!");
    process.exit(1);
  }
  
  console.log(`\nSetting password for ${email1}...`);
  const success1 = await setPassword(email1, password1);
  results.push({ email: email1, success: success1 });
  
  if (success1) {
    console.log(`✓ Password set for ${email1}`);
  }
  
  console.log("\n");
  
  // Get credentials for User 2
  console.log("═══ User 2 ═══");
  const email2 = await prompt("Email: ");
  if (!email2) {
    console.error("Email cannot be empty.");
    process.exit(1);
  }
  
  const password2 = await prompt("Password: ", true);
  if (!password2) {
    console.error("Password cannot be empty.");
    process.exit(1);
  }
  
  const confirmPassword2 = await prompt("Confirm password: ", true);
  if (password2 !== confirmPassword2) {
    console.error("❌ Passwords do not match!");
    process.exit(1);
  }
  
  console.log(`\nSetting password for ${email2}...`);
  const success2 = await setPassword(email2, password2);
  results.push({ email: email2, success: success2 });
  
  if (success2) {
    console.log(`✓ Password set for ${email2}`);
  }
  
  // Summary
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║  Summary                                                   ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  
  const allSuccessful = results.every(r => r.success);
  
  for (const result of results) {
    const icon = result.success ? "✓" : "✗";
    const status = result.success ? "SUCCESS" : "FAILED";
    console.log(`  ${icon} ${result.email}: ${status}`);
  }
  
  if (allSuccessful) {
    console.log("\n✓ All passwords set successfully!");
    console.log("\nYou can now log in to the app with email/password authentication.");
    process.exit(0);
  } else {
    console.log("\n❌ Some passwords failed to set. Please check the errors above.");
    process.exit(1);
  }
}

// Run the script
main().catch((err) => {
  console.error("\n❌ Unexpected error:", err);
  process.exit(1);
});
