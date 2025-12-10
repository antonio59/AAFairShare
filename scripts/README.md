# Scripts

This directory contains utility scripts for managing the AAFairShare application.

## Password Management

### `set-passwords.ts` - Bootstrap User Passwords (Interactive)

Interactive script to set passwords for both household users. This is the recommended way to bootstrap passwords when setting up the application.

**Usage:**
```bash
bun scripts/set-passwords.ts
```

**Features:**
- Prompts for each user's email and password interactively
- Password input is hidden (shown as asterisks)
- Requires password confirmation to prevent typos
- Updates both user records in Convex with hashed passwords (bcrypt)
- Provides detailed feedback on success or failure
- Only works with local Convex development environment

**Requirements:**
- Users must already exist in the Convex database
- Convex dev server must be running (`bun run dev:convex`)
- Script must be run against local environment (not production)

**Example output:**
```
╔════════════════════════════════════════════════════════════╗
║  AAFairShare - Bootstrap User Passwords                    ║
╚════════════════════════════════════════════════════════════╝

✓ Running against local Convex development environment

This script will set passwords for both household users.
Make sure the users already exist in your Convex database.

═══ User 1 ═══
Email: alice@example.com
Password: ********
Confirm password: ********

Setting password for alice@example.com...
✓ Password set for alice@example.com

═══ User 2 ═══
Email: bob@example.com
Password: ********
Confirm password: ********

Setting password for bob@example.com...
✓ Password set for bob@example.com

╔════════════════════════════════════════════════════════════╗
║  Summary                                                   ║
╚════════════════════════════════════════════════════════════╝

  ✓ alice@example.com: SUCCESS
  ✓ bob@example.com: SUCCESS

✓ All passwords set successfully!

You can now log in to the app with email/password authentication.
```

### `set-password.ts` - Set Single User Password (Non-interactive)

Command-line script to set a password for a single user. Useful for scripting or quick password updates.

**Usage:**
```bash
bun scripts/set-password.ts <email> <password>
```

**Example:**
```bash
bun scripts/set-password.ts user@example.com mysecurepassword
```

## Data Management

### `audit-user-links.ts`

Audits user references in the database to ensure data integrity.

**Usage:**
```bash
bun scripts/audit-user-links.ts
```
or
```bash
bun run audit-user-links
```

## Testing & Development

### `capture-screens.ts`

Captures screenshots of various application pages for documentation and testing purposes.

**Usage:**
```bash
bun scripts/capture-screens.ts
```
or
```bash
bun run capture
```

Screenshots are saved to `artifacts/screenshots/`.

## Security Notes

- Password scripts use bcrypt hashing (10 salt rounds) via `convex/utils/password.ts`
- Passwords are never stored in plain text
- Local environment checks prevent accidental production updates
- All scripts require proper Convex authentication and environment setup
