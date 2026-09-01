---
paths:
  - "**/*.ts"
---

# TypeScript Conventions

**Scope:** Language-level conventions, type design, and lint rules — the baseline for every `.ts`
file in the repo. For the conventions of a specific subsystem, see the narrower sibling rules
(`api.md`, `auth.md`, `database.md`, `error-handling.md`, `validation.md`, `testing.md`), which
layer on top of this one.

## Code Organization

- Use `src/shared/types/*.type.ts` files for shared types
- Use `src/helpers` directory for shared helpers

# Coding Standards

- Use descriptive names for variables and methods (no single letters except loop indices)
- Always use curly braces for control structures, even for single-line blocks
- Use `// biome-ignore lint` with explanatory comments
- Prefer nullish coalescing (??) over OR (||)
- Explicitly type function parameters, return types, and object literals.
- Avoid using Enums instead:
```typescript
export const BrandStatusEnum = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

export type BrandStatus =
    (typeof BrandStatusEnum)[keyof typeof BrandStatusEnum];
```
- Use `readonly` modifiers for immutable properties and arrays
- Leverage TypeScript's utility types (`Partial`, `Required`, `Pick`, `Omit`, `Record`, etc.)
- Use discriminated unions with exhaustiveness checking for type narrowing
- Prefer type declarations over interfaces unless a real benefit exists
