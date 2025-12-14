# Development Guide

> Contributing and development workflows

## Quick Start

```bash
# Clone and install
git clone https://github.com/antonio59/aafairshare.git
cd aafairshare
bun install

# Start development
bun x convex dev  # Terminal 1 - Backend
bun run dev       # Terminal 2 - Frontend
```

## Development Workflow

### Daily Development

1. **Pull latest changes**

   ```bash
   git pull origin main
   bun install
   ```

2. **Start services**

   ```bash
   bun run dev  # Starts both Convex and Vite
   ```

3. **Make changes**
   - Edit code
   - Changes auto-reload

4. **Test changes**

   ```bash
   bun test
   bun run lint
   bun run typecheck
   ```

5. **Commit changes**
   ```bash
   git add .
   git commit -m "Description of changes"
   ```

## Available Scripts

| Script              | Description              |
| ------------------- | ------------------------ |
| `bun run dev`       | Start dev server         |
| `bun run build`     | Production build         |
| `bun run preview`   | Preview production build |
| `bun run lint`      | Run ESLint               |
| `bun run lint:fix`  | Fix lint issues          |
| `bun run typecheck` | TypeScript check         |
| `bun test`          | Run tests                |

## Code Quality

### Linting

ESLint configuration in `eslint.config.js`:

- TypeScript rules
- React hooks rules
- No unused variables (with `_` prefix exception)

```bash
# Check
bun run lint

# Fix
bun run lint:fix
```

### Type Checking

```bash
bun run typecheck
# or
bunx --bun tsc --noEmit
```

### Testing

Tests use Bun's built-in test runner:

```bash
bun test
```

Test files: `*.test.ts` or `*.test.tsx`

## Project Conventions

### File Naming

| Type       | Convention      | Example              |
| ---------- | --------------- | -------------------- |
| Components | PascalCase      | `ExpenseTable.tsx`   |
| Hooks      | camelCase + use | `useExpenses.ts`     |
| Utils      | camelCase       | `dateUtils.ts`       |
| Tests      | \*.test.ts      | `validation.test.ts` |

### Component Structure

```tsx
// 1. Imports
import { useState } from "react";
import { Button } from "@/components/ui/button";

// 2. Types
interface Props {
  title: string;
}

// 3. Component
const MyComponent = ({ title }: Props) => {
  // Hooks
  const [state, setState] = useState();

  // Handlers
  const handleClick = () => {};

  // Render
  return <div>{title}</div>;
};

// 4. Export
export default MyComponent;
```

### Convex Function Structure

```typescript
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuthenticatedUser } from "./utils/auth";
import { assertValidMonth } from "./utils/validation";

export const myQuery = query({
  args: { month: v.string() },
  handler: async (ctx, args) => {
    // 1. Auth check
    await requireAuthenticatedUser(ctx);

    // 2. Validation
    assertValidMonth(args.month);

    // 3. Business logic
    const data = await ctx.db.query("expenses").collect();

    // 4. Return
    return data;
  },
});
```

## Branching Strategy

```
main (production)
  └── feature/feature-name
  └── fix/bug-description
  └── refactor/refactor-description
```

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

## Pull Request Process

1. **Create branch**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make changes and commit**

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. **Push and create PR**

   ```bash
   git push origin feature/my-feature
   ```

4. **PR Requirements**
   - Passes all CI checks
   - No TypeScript errors
   - No lint errors
   - Tests pass

## Commit Message Format

```
type: description

[optional body]
```

Types:

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `style` - Formatting
- `test` - Tests
- `chore` - Maintenance

Examples:

```
feat: add recurring expense split type selector
fix: correct settlement calculation for custom splits
refactor: extract batch fetch utilities
docs: add API documentation
```

## Debugging

### Frontend Debugging

1. **React DevTools** - Component inspection
2. **Console logs** - `console.log()`
3. **Network tab** - Convex calls

### Backend Debugging

1. **Convex Dashboard** - View logs and data
2. **Console logs** - `console.log()` in functions
3. **Error messages** - Thrown errors appear in client

### Common Issues

| Issue                  | Solution                                        |
| ---------------------- | ----------------------------------------------- |
| Convex not connecting  | Check `.env` and re-run `convex dev`            |
| Types out of sync      | Delete `convex/_generated`, re-run `convex dev` |
| Hot reload not working | Restart dev server                              |
| Auth not working       | Check JWT keys in Convex env                    |

## IDE Setup

### VS Code

Recommended extensions:

- ESLint
- Prettier
- TypeScript
- Tailwind CSS IntelliSense
- Convex

Settings (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "non-relative"
}
```

## Documentation

| Document                                  | Description                 |
| ----------------------------------------- | --------------------------- |
| [Contributing](./contributing.md)         | Detailed contribution guide |
| [Coding Standards](./coding-standards.md) | Code style rules            |
| [Testing](./testing.md)                   | Testing strategies          |
| [Troubleshooting](./troubleshooting.md)   | Common issues               |

## Next Steps

- [Contributing Guide](./contributing.md)
- [Coding Standards](./coding-standards.md)
- [Architecture](../architecture/README.md)
