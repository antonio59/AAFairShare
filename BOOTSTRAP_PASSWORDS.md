# Password Bootstrap Guide

This guide explains how to set up passwords for household users in AAFairShare.

## Overview

AAFairShare uses email/password authentication via Convex Auth. The application is closed to new registrations, so you must manually set passwords for existing users.

## Prerequisites

Before setting passwords:

1. **Convex Dev Server Running**: Start the Convex development server:
   ```bash
   bun run dev:convex
   ```

2. **Users Must Exist**: The users must already exist in your Convex database with valid email addresses.

3. **Local Environment**: The script only works against local Convex development environments for safety.

## Setting Passwords

### Option 1: Interactive Script (Recommended)

Use the interactive script to set passwords for both household users at once:

```bash
bun run set-passwords
```

The script will:
1. Verify you're running against a local Convex environment
2. Prompt for User 1's email and password
3. Confirm User 1's password
4. Prompt for User 2's email and password
5. Confirm User 2's password
6. Update both users in the database with bcrypt-hashed passwords
7. Display a summary of the results

**Example session:**
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

### Option 2: Single User Script

To set a password for a single user:

```bash
bun scripts/set-password.ts user@example.com mysecurepassword
```

This is useful for:
- Updating a single user's password
- Scripting/automation scenarios
- Quick password resets during development

## How It Works

### Password Security

1. **Bcrypt Hashing**: Passwords are hashed using bcrypt with 10 salt rounds via `convex/utils/password.ts`
2. **Salted Hashes**: Each hash includes a unique salt, so the same password produces different hashes
3. **One-Way Function**: Hashes cannot be reversed to obtain the original password
4. **Database Storage**: Only the hash is stored in the `passwordHash` field of the user record

### Convex Integration

The script calls the `password:setPassword` internal mutation which:
1. Looks up the user by email
2. Hashes the provided password using bcrypt
3. Updates the user record with:
   - `passwordHash`: The bcrypt hash
   - `passwordUpdatedAt`: Current timestamp

### Authentication Flow

After setting passwords:
1. Users can log in at the application login page
2. Convex Auth's Credentials provider validates the email/password
3. The auth handler queries the user by email
4. The provided password is verified against the stored hash using bcrypt
5. If valid, a session is created for the user

## Verification

To verify passwords were set correctly:

1. **Check the script output**: Look for success messages
2. **Try logging in**: Navigate to your app and attempt to log in with the credentials
3. **Query Convex**: Use the Convex dashboard to verify the `passwordHash` field is populated

## Troubleshooting

### "User not found" error

**Cause**: The email doesn't exist in the database

**Solution**: 
- Double-check the email spelling
- Create the user in Convex first
- Check the users table in the Convex dashboard

### "This script can only be run against a LOCAL Convex development environment"

**Cause**: The script detected a non-local Convex URL

**Solution**:
- Make sure `bun run dev:convex` is running
- Check that `CONVEX_URL` is not set to a production URL
- The script is designed to prevent accidental production updates

### Password confirmation doesn't match

**Cause**: Typo when entering password confirmation

**Solution**: Run the script again and carefully re-enter both passwords

### Cannot authenticate after setting password

**Possible causes**:
- Wrong email or password entered
- User exists but with different email
- Frontend not connected to same Convex deployment

**Solution**:
- Verify the email matches exactly (case-sensitive)
- Check Convex dashboard to see the user's actual email
- Ensure frontend `VITE_CONVEX_URL` matches the backend

## Security Notes

- **Never commit passwords**: Don't add passwords to code or env files
- **Local only**: The script blocks production environments
- **Secure storage**: Only bcrypt hashes are stored, never plain text
- **Password strength**: Use strong, unique passwords for each user
- **Environment isolation**: Keep development and production databases separate

## Related Files

- `scripts/set-passwords.ts` - Interactive bootstrap script
- `scripts/set-password.ts` - Single user script
- `convex/password.ts` - Password mutations
- `convex/utils/password.ts` - Bcrypt utilities
- `convex/auth.ts` - Credentials authentication provider
- `convex/users.ts` - User queries
- `convex/schema.ts` - User schema with passwordHash field

## Next Steps

After bootstrapping passwords:

1. **Test Authentication**: Try logging in with both user accounts
2. **Update Passwords**: Users can change their passwords from the Settings page
3. **Backup Credentials**: Store passwords securely (password manager recommended)
4. **Deploy**: When ready, deploy to production and repeat password setup for prod users

## Support

For issues or questions:
- Check the [main README](./README.md) for general setup
- Review [scripts/README.md](./scripts/README.md) for all available scripts
- Examine the Convex dashboard for database state
