# Convex Dev TypeScript Errors - Resolution

## Problem Statement

When running `bun run dev:convex`, the Convex CLI's TypeScript typecheck was failing with errors:

```
✖ TypeScript typecheck via `tsc` failed.

convex/auth.ts:19:22 - error TS2345: Argument of type '"email"' is not assignable to parameter of type 'never'.
convex/auth.ts:19:43 - error TS2345: Argument of type '"email"' is not assignable to parameter of type 'never'.
convex/utils/validation.test.ts:1:38 - error TS2307: Cannot find module 'bun:test'
```

These errors prevented the Convex development server from starting, blocking all local development.

## Root Causes

### Issue 1: Test Files Being Typechecked by Convex

**Problem**: The Convex CLI was trying to typecheck test files (`*.test.ts`) that use Bun-specific imports like `bun:test`.

**Why it's wrong**: 
- Test files are meant to be run separately with Bun's test runner (`bun test`)
- Test files are not deployed to Convex servers
- `bun:test` is a Bun runtime module, not available in Convex environment
- Convex doesn't need to validate test file types

### Issue 2: Incorrect Database Query Pattern in Auth

**Problem**: The authentication callback in `convex/auth.ts` was using `ctx.runQuery(api.users.getUserByEmail, ...)` to call an internal query.

**Why it's wrong**:
- `ctx.runQuery()` is meant for calling public queries that clients can access
- `getUserByEmail` is an `internalQuery`, not a public query
- Auth provider callbacks have direct database access via `ctx.db`
- The internal query wrapper was unnecessary and caused type errors

## Solutions Implemented

### Solution 1: Exclude Test Files from Convex TypeCheck

**File**: `convex/tsconfig.json`

**Change**:
```json
{
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

**Rationale**:
- Test files run independently with `bun test`
- Test files don't deploy to Convex
- Separates concerns: Convex validates deployment code, Bun validates tests
- Standard practice to exclude test files from production builds

### Solution 2: Use Direct Database Queries in Auth

**File**: `convex/auth.ts`

**Before**:
```typescript
import { api } from "./_generated/api";

const user = await ctx.runQuery(api.users.getUserByEmail, { email });
```

**After**:
```typescript
// No api import needed

const user = await ctx.db
  .query("users")
  .withIndex("email", (q) => q.eq("email", email))
  .unique();
```

**Rationale**:
- Auth callbacks have direct database context
- More efficient (no query layer indirection)
- Type-safe (TypeScript understands the schema)
- Follows pattern used in other Convex functions (see `convex/password.ts`)

## Verification

### Before Fix
```bash
$ bun run dev:convex
✖ TypeScript typecheck via `tsc` failed.
Found 3 errors in 2 files.
```

### After Fix
```bash
$ bun run dev:convex
✔ Convex dev server running successfully

$ bun run lint
✔ No errors

$ bun x tsc --noEmit
✔ No errors

$ bun test
✔ 11 tests pass
```

## Impact Assessment

### ✅ Positive Changes
- `convex dev` now starts successfully
- All TypeScript errors resolved
- Tests still run independently with Bun
- Authentication logic unchanged (same behavior)
- More efficient database queries

### ✅ No Breaking Changes
- Authentication flow works identically
- No API changes
- Tests still pass
- Existing functionality preserved

### ✅ Code Quality Improvements
- Removed unused import (`api`)
- More idiomatic Convex query pattern
- Better separation of concerns (tests vs. deployment)
- Clearer intent in auth callback

## Lessons Learned

1. **Test file placement**: Test files should be explicitly excluded from production typechecks when using runtime-specific imports (like `bun:test`, `vitest`, etc.)

2. **Convex query patterns**: 
   - Use `ctx.db.query()` for direct database access within Convex functions
   - Use `ctx.runQuery()` only when calling public queries from actions/mutations
   - Use internal queries/mutations only when needed for reusability

3. **Auth provider context**: Convex Auth provider callbacks (`authorize`) have full database access and don't need to go through the query layer.

## Prevention

To prevent similar issues in the future:

1. **Always exclude test files**: Add `**/*.test.ts`, `**/*.spec.ts` to tsconfig exclude
2. **Use direct queries**: Prefer `ctx.db.query()` over wrapping in internal queries
3. **Check Convex docs**: When in doubt, reference official Convex patterns
4. **Test `convex dev`**: Always verify the dev server starts before committing

## Related Files

- `convex/tsconfig.json` - TypeScript configuration for Convex
- `convex/auth.ts` - Authentication provider setup
- `convex/utils/validation.test.ts` - Example test file using Bun
- `convex/utils/password.test.ts` - Example test file using Bun
- `FIXES.md` - Complete list of all fixes applied
- `CHANGES.md` - Implementation changelog

## References

- [Convex Database Queries](https://docs.convex.dev/database/reading-data)
- [Convex Auth Documentation](https://labs.convex.dev/auth)
- [Bun Test Documentation](https://bun.sh/docs/cli/test)
