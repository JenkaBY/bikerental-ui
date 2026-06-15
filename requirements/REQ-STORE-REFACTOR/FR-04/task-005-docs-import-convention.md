# Task 005: Document the three-part shared-import convention in AGENTS.md and CLAUDE.md

> **Applied Skill:** `skill-authoring` / repo docs-sync conventions (CLAUDE.md §"Keep docs in sync
> with code") + `typescript-es2022` module-style guidance. Encodes the FR-04 design §6
> "Documentation (`AGENTS.md`)" requirement so future authors know the convention the lint rule
> enforces. Run this LAST, after the code and lint rule are green.

## 1. Objective

Add the three-part import-convention rule (1: consumers use `@bikerental/shared` only; 2: inside
`shared` use relative paths, never the barrel, never `@store.*`; 3: the root `eslint.config.js`
`no-restricted-imports` rule enforces both in CI) to `AGENTS.md`, and mirror the same note in
`CLAUDE.md` to satisfy the docs-sync rule. Documentation only — no code changes.

## 2. Files to Modify

1. `D:\Workspace\private\bikerental-ui\AGENTS.md`
2. `D:\Workspace\private\bikerental-ui\CLAUDE.md`

- **Action:** Modify Existing Files

## 3. Code Implementation

### Edit A — `AGENTS.md`

Insert a new subsection immediately AFTER the "Three-Layer Data Pipeline (enforced)" section. That
section currently ends at the last bullet ("Regeneration: Run `npm run generate:api` …", line 31),
followed by a blank line and then `## Angular Patterns` (line 33).

**Location:** between line 31 (the "Regeneration" bullet) and line 33 (`## Angular Patterns`).

**Snippet to insert (preceded and followed by one blank line):**

```markdown
## Shared Import Convention (enforced by lint)

- **Cross-project code** (`projects/admin`, `projects/operator`, `projects/gateway`) MUST import
  shared symbols from **`@bikerental/shared`** — never a deep relative path into
  `projects/shared/src` (e.g. `../../../shared/src/...`), and never the `@store.*` alias. One barrel
  import line per file.
- **Inside the `shared` library** (`projects/shared/**`) use **relative paths** between modules
  (e.g. `./user.store`, `../state/time.store`). Never import the `@bikerental/shared` barrel from
  inside `shared` (self-import causes circular module-init / duplicate-class-identity bugs), and
  never use `@store.*` either.
- The `no-restricted-imports` rule in the root `eslint.config.js` enforces both directions and runs
  in CI, so `npm run lint` fails on any violation. Generated client code under
  `core/api/generated/**` is exempt (already in the config `ignores`).
```

### Edit B — `CLAUDE.md`

Mirror the same note as a single bullet appended to the "Enterprise Angular patterns (in addition to
AGENTS.md)" list. That list's last bullet is "Lifecycle & navigation …" (ends at line 63), followed
by a blank line and `## Keep docs in sync with code` (line 65).

**Location:** append after the "Lifecycle & navigation" bullet (line 63), before the blank line that
precedes `## Keep docs in sync with code`.

**Snippet to insert (as the next list bullet):**

```markdown
- **Shared import convention (lint-enforced)** — cross-project code (`admin`/`operator`/`gateway`)
  imports shared symbols only from `@bikerental/shared` (never a deep `projects/shared/src` relative
  path, never `@store.*`); inside the `shared` library use relative paths between modules (never the
  `@bikerental/shared` barrel — self-import causes cyclic init — and never `@store.*`). The
  `no-restricted-imports` rule in the root `eslint.config.js` enforces both and runs in CI.
```

## 4. Validation Steps

Execute from the repo root `D:\Workspace\private\bikerental-ui`. Markdown-only change; verify the
rest of the repo still lints/builds clean (no regression introduced). Do NOT start the dev server,
run E2E, or inspect databases.

```bash
npm run lint
npm run build
```

Both must remain green (Markdown edits don't affect TS lint/build, but run them to confirm nothing
else regressed). Visually confirm the new subsection renders correctly in `AGENTS.md` and the new
bullet in `CLAUDE.md`.
