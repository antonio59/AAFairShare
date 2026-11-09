## Summary

<!-- What changes for Antonio and Jamie, in plain English. -->

## Testing

<!-- pnpm run lint && pnpm exec tsc --noEmit && bun test && pnpm run build -->

## Release checklist

- [ ] User-facing change? Bump `version` in `package.json` (new feature: minor; fix only: patch).
- [ ] Added the same version and date to `VERSION_HISTORY` in `src/lib/version.ts` (shown in Settings → About).
- [ ] Added a `## [x.y.z] - YYYY-MM-DD` section to the release notes in the `cliff.toml` header. `CHANGELOG.md` is regenerated from it, so don't edit `CHANGELOG.md` by hand.
- [ ] Updated `README.md` and `docs/` if what users see has changed.
- [ ] Not user-facing (CI, tests, refactor only), so no version bump needed.
