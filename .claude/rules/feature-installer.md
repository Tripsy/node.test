---
paths:
  - "cli/feature.ts"
  - "cli/helpers/version.ts"
  - "cli/check-manifests.ts"
  - "packages/**/manifest.json"
  - "src/features/**/manifest.json"
---

# Feature Installer

**Scope:** packaging a feature into `packages/`, the `manifest.json` contract, and the dependency
checks `cli/feature.ts` runs. For the layout of a feature itself, see `.claude/CLAUDE.md`
§"Feature-based modules".

Features can be packaged in `packages/` and installed into `src/features/` via
`tsx cli/feature.ts <feature> install|remove|upgrade`. The CLI enforces dependency ordering, blocks
removal of core features, backs up on upgrade, supports rollback, and **prompts you to run
migrations manually** for entity-bearing features. Hardcodes `basePath = /var/www/html`.

Each package carries a `manifest.json`:

```json
{
  "name": "product",
  "version": "1.0.0",
  "is_core": true,
  "relativePath": "/product",
  "entities": ["product", "product-variant"],
  "depends_on": ["brand", "vendor@^2.0.0"],
  "required_by": ["order", "grn"]
}
```

**The two dependency fields point in opposite directions.** `depends_on` is what this feature needs;
`required_by` is what needs *it*, and exists so `remove` can refuse to delete something still in use.
`is_core` is a separate boolean (omitted when false), not a magic entry inside a list.

**Both are version-aware.** An entry is either a bare name (any version) or `name@range` —
`vendor@^2.0.0`, `order@>=1.2.0`. Ranges are matched by `cli/helpers/version.ts`, a small subset of
semver: one constraint per entry, operators `^ ~ >= <= > < =` (or none, meaning exact) over
`major.minor.patch`, plus `*`. No pre-release tags, no unions — bump `version` on any change a
dependent could notice, majors for breaking ones.

Three checks run per mode:

- **install / upgrade** — every `depends_on` entry must be installed *and* inside its range.
- **install / upgrade** — every already-installed feature that names this one must accept the
  incoming version, so an upgrade cannot silently break what sits on top of it.
- **remove** — refused outright when `is_core`, otherwise blocked by any installed dependent.
  Reverse dependencies are found by scanning every installed manifest's `depends_on`, not by
  trusting `required_by`, which is hand-maintained and drifts; `required_by` still declares intent.

`pnpm run manifests:check` validates the whole graph — unresolvable or unsatisfiable `depends_on`,
dependency cycles, and `required_by` entries that have fallen out of step.
