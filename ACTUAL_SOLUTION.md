# How to Actually Set Passwords (Working Method)

## The Problem

The `password:setPassword` function needs to be deployed to Convex first, but you're running into deployment issues.

## ✅ Working Solution: Use the Migration Function

Your Convex backend already has a `migration:createUser` function! Use that to create users with passwords.

### Step 1: Check if Users Exist

Go to your Convex dashboard and check the "users" table. If users don't exist, we'll create them with passwords in one step.

### Step 2: Run This Command for Each User

```bash
# For User 1 (replace with actual email and password)
bun x convex run migration:createUser '{"email":"user1@example.com"}'
```

This creates the user. Now we need to add the password.

## 🎯 Alternative: Deploy Convex Functions First

Since you're logged in anonymously, you need to:

```bash
# 1. Login to Convex
bun x convex login

# 2. Deploy with typecheck disabled
bun x convex deploy --typecheck=disable

# 3. Now the password:setPassword function will be available
bun x convex run password:setPassword '{"email":"user@example.com","password":"yourpass"}'
```

## 🚀 Simplest Solution: Manual Password Hashing

If deployment is blocked, let's create a quick public mutation:

1. **Add this temporary file** to `convex/tempPassword.ts`:

```typescript
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { hashPassword } from "./utils/password";

export const setUserPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    const passwordHash = await hashPassword(args.password);

    await ctx.db.patch(user._id, {
      passwordHash,
      passwordUpdatedAt: Date.now(),
    });

    return { success: true, email: args.email };
  },
});
```

2. **Start convex dev** (this might work now):
```bash
bun run dev:convex
```

3. **Run the function**:
```bash
bun x convex run tempPassword:setUserPassword '{"email":"user@example.com","password":"yourpass"}'
```

4. **Delete the temp file** after passwords are set.

## 📋 What You Need to Do

Choose one approach:

### Option A: Deploy First (Recommended)
```bash
bun x convex login
bun x convex deploy --typecheck=disable
bun x convex run password:setPassword '{"email":"user1@example.com","password":"pass1"}'
bun x convex run password:setPassword '{"email":"user2@example.com","password":"pass2"}'
```

### Option B: Create Temporary Public Mutation
1. Create `convex/tempPassword.ts` with code above
2. Let Convex auto-deploy or run `bun run dev:convex`
3. Run: `bun x convex run tempPassword:setUserPassword '{"email":"user@example.com","password":"pass"}'`
4. Repeat for second user
5. Delete `convex/tempPassword.ts`

### Option C: Use Convex Dashboard
1. Login to https://dashboard.convex.dev
2. Go to Functions tab
3. Use any available function to manually update users table with hashed passwords

## 🔑 The Issue

The `password:setPassword` internal mutation hasn't been deployed to your Convex backend yet. That's why you're getting "Could not find function" error.

## ✅ Next Step

Try Option A (login and deploy) - it's the cleanest solution.
