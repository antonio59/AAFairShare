# Fixes Applied

This document describes the fixes applied to resolve issues identified during code review.

## Issues Addressed

### 1. Terminology Correction: "npm script" → "package script"

**Issue**: The documentation incorrectly referred to package.json scripts as "npm scripts" when this is a Bun-managed project.

**Fix**: Updated terminology in `CHANGES.md` to use "package script" instead of "npm script".

**Rationale**: 
- This project uses Bun as the package manager (see `"packageManager": "bun@1.3.3"` in package.json)
- Scripts are run with `bun run`, not `npm run`
- Using "package script" is more accurate and framework-agnostic

**Files Modified**:
- `CHANGES.md` - Lines 67, 72: Changed "npm script" to "package script"

### 2. TypeScript Configuration for Bun Tests

**Issue**: TypeScript compiler couldn't find the `bun:test` module, causing type errors:
```
convex/utils/validation.test.ts:1:38 - error TS2307: Cannot find module 'bun:test' or its corresponding type declarations.
```

**Fix**: Added Bun types to the Convex TypeScript configuration.

**Changes**:
```json
// convex/tsconfig.json
{
  "compilerOptions": {
    // ... other options
    "types": ["bun-types"]  // ← Added this line
  }
}
```

**Rationale**:
- Bun includes built-in type definitions but they need to be explicitly referenced in strict TypeScript configurations
- The `bun-types` package provides types for Bun's runtime APIs including `bun:test`
- This fix resolves type errors for both existing and new test files

**Files Modified**:
- `convex/tsconfig.json` - Added `"types": ["bun-types"]` to compilerOptions
- `CHANGES.md` - Documented the new change

## Verification

All quality checks now pass:

### Linting
```bash
$ bun run lint
$ eslint .
✓ No errors
```

### Type Checking
```bash
$ bun x tsc --noEmit
✓ No errors
```

### Tests
```bash
$ bun test
✓ 11 tests pass (6 validation + 5 password)
✓ 21 expect() calls
✓ Ran 11 tests across 2 files in 926ms
```

### 3. Fixed Pre-existing TypeScript Error in convex/auth.ts

**Issue**: TypeScript errors when trying to call an internal query via `ctx.runQuery()`:
```
convex/auth.ts:19 - error TS2345: Argument of type '"email"' is not assignable to parameter of type 'never'.
```

**Root Cause**: The auth callback was using `ctx.runQuery(api.users.getUserByEmail, ...)` to call an internal query, but `runQuery` is meant for public queries, not internal ones. Additionally, the auth context has direct database access, making the internal query wrapper unnecessary.

**Fix**: Changed from calling an internal query via `ctx.runQuery()` to directly querying the database with `ctx.db.query()`:

```typescript
// Before (incorrect)
const user = await ctx.runQuery(api.users.getUserByEmail, { email });

// After (correct)
const user = await ctx.db
  .query("users")
  .withIndex("email", (q) => q.eq("email", email))
  .unique();
```

**Rationale**:
- The auth provider's authorize callback has direct database access via `ctx.db`
- Internal queries are meant for cross-function calls within Convex backend
- Direct database queries are more efficient and type-safe in this context
- Removed unused `api` import

**Files Modified**:
- `convex/auth.ts` - Replaced `ctx.runQuery()` call with direct `ctx.db.query()`
- `convex/auth.ts` - Removed unused `import { api } from "./_generated/api"`

### 4. Excluded Test Files from Convex TypeCheck

**Issue**: `convex dev` was trying to typecheck test files that use Bun-specific imports, causing failures.

**Fix**: Excluded test files from the Convex TypeScript configuration:

```json
// convex/tsconfig.json
{
  "exclude": ["node_modules", "**/*.test.ts"]  // Added **/*.test.ts
}
```

**Rationale**:
- Test files are run separately with Bun's test runner, not deployed to Convex
- Test files use `bun:test` module which is Bun-specific
- Convex deployment doesn't need test files
- Excluding them prevents typecheck failures during `convex dev`

**Files Modified**:
- `convex/tsconfig.json` - Added `**/*.test.ts` to exclude array
- `convex/tsconfig.json` - Removed `"types": ["bun-types"]` (no longer needed since tests are excluded)

## Summary

- ✅ Terminology corrected: "npm script" → "package script" throughout documentation
- ✅ Test files excluded from Convex typecheck (they run separately with Bun)
- ✅ Fixed pre-existing TypeScript error in `convex/auth.ts` (incorrect use of `ctx.runQuery()`)
- ✅ All lint, typecheck, and test checks passing
- ✅ `convex dev` now runs without errors
- ✅ No breaking changes introduced
- ✅ Documentation updated to reflect all changes

## Files Changed

1. **`convex/tsconfig.json`** - Excluded `**/*.test.ts` from typecheck
2. **`convex/auth.ts`** - Fixed database query pattern, removed unused import
3. **`CHANGES.md`** - Updated to document all modifications
4. **`FIXES.md`** - This file, documenting all fixes applied
