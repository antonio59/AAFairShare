import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "convex/_generated"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    // Household members are never deleted; mutations must use the guarded builders.
    files: ["convex/**/*.ts"],
    ignores: ["convex/utils/functions.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: ["./_generated/server", "../_generated/server"].map((name) => ({
            name,
            importNames: ["mutation", "internalMutation"],
            message: "Import mutation builders from convex/utils/functions so household members cannot be deleted.",
          })),
          patterns: [
            {
              group: ["convex/server"],
              importNames: ["mutationGeneric", "internalMutationGeneric"],
              message: "Import mutation builders from convex/utils/functions so household members cannot be deleted.",
            },
          ],
        },
      ],
    },
  },
);
