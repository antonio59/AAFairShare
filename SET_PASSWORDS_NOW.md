# Set Passwords NOW - No Dev Server Needed

You don't need `convex dev` running to set passwords! Here are your options:

## ⚡ Quickest Method: Direct CLI Commands

Just run these commands directly (replace with your actual emails and passwords):

```bash
# User 1
bun x convex run password:setPassword --args '{"email":"user1@example.com","password":"password123"}'

# User 2
bun x convex run password:setPassword --args '{"email":"user2@example.com","password":"password456"}'
```

**That's it!** No dev server needed, no TypeScript errors, passwords are set immediately.

## ✅ Verify It Worked

After running the commands above, you should see output like:
```
✓ Mutation complete
```

Now you can try logging into your app with those credentials!

## 🎯 Alternative: Quick Interactive Script

If you prefer prompts, run:

```bash
bun scripts/quick-set-passwords.ts
```

This will ask for both users' emails and passwords, then set them using the same CLI commands above.

## 📊 What These Commands Do

1. Call the `password:setPassword` internal mutation in Convex
2. Hash your password with bcrypt (10 salt rounds)
3. Store the hash in the user's record
4. That's it!

## 🔍 Check Passwords in Convex Dashboard

1. Go to https://dashboard.convex.dev
2. Select your project
3. Go to "Data" tab
4. Click on "users" table
5. You should see `passwordHash` and `passwordUpdatedAt` fields populated

## ❓ What If Users Don't Exist?

If you get "User not found" error, you need to create the users first in the Convex dashboard:

1. Go to "Data" tab
2. Click "users" table  
3. Click "Add row"
4. Add at minimum: `email` field with the user's email
5. Then run the password command again

## 🎉 You're Done!

Once both users have passwords set:
- They can log in to the app
- You can continue with development
- The TypeScript issue with `convex dev` doesn't block you

## 🗑️ Clean Up (Optional)

After passwords are set, you can delete:
- `convex/passwordSetup.ts` (if created)
- This file (`SET_PASSWORDS_NOW.md`)

## 🚀 Next Steps

After passwords are set:
1. Start your frontend: `bun run dev`
2. Try logging in with the credentials you just set
3. Start working on features!

You can fix the `convex dev` TypeScript issue later - it doesn't block development since you can deploy and work without it running locally.
