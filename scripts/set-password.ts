import { execSync } from "child_process";

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error("Usage: bun scripts/set-password.ts <email> <password>");
  console.error("Example: bun scripts/set-password.ts user@example.com mysecurepassword");
  process.exit(1);
}

const [email, password] = args;

console.log(`Setting password for ${email}...`);

try {
  // Use bunx convex to run the internal mutation
  const command = `bunx convex run password:setPassword --args '${JSON.stringify({ email, password })}'`;
  
  const output = execSync(command, { encoding: "utf-8", stdio: "pipe" });
  console.log("Success! Password updated.");
} catch (err: unknown) {
  const error = err as { stdout?: Buffer | string; stderr?: Buffer | string; message: string };
  console.error("Failed to set password.");
  if (error.stdout) console.log(error.stdout.toString());
  if (error.stderr) console.error(error.stderr.toString());
  process.exit(1);
}
