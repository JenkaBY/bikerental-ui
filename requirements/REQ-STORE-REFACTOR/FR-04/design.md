# System Design: FR-04 - Standardize Shared Import Paths + Lint Guard

## 1. Architectural Overview

The workspace has four projects — three consuming applications (`gateway`, `admin`, `operator`)
and one shared library (`shared`) — that all reach the same set of shared symbols (stores, models,
components, constants). Today those symbols are reachable through three distinct module specifiers,
and the codebase uses all three, sometimes mixing two of them inside a single file. Reaching the
same injectable through two specifiers can yield two distinct class identities under some
bundler/test configurations, which silently breaks `useExisting` aliases and `{ provide: X }`
overrides. This story collapses the cross-project import surface to exactly one canonical specifier
(`@bikerental/shared`) and adds a lint guard so regressions fail CI. It is a pure import-path
refactor: no store/model logic, no provider wiring, and no runtime behaviour changes. The topology,
component boundaries, and existing contracts are untouched; only the *edges* of the module graph are
normalized.

The one structural nuance — carried forward from the FR-03 finding (P-A5) — is that the shared
library cannot route its own intra-library imports through its own public barrel without creating a
self-referential edge in the module graph, which is a known source of circular module-initialization
and duplicate-class-identity bugs. The design therefore treats "cross-project imports" and
"intra-library imports" as two distinct rule scopes and resolves them differently.

## 2. Impacted Components

This is an inter-project import-hygiene change; the affected "components" are the consuming
application projects, the shared library, and the lint configuration. No runtime component (store,
service, UI component) changes its responsibilities or contract.

* **`admin` (Admin Application):** All imports of shared symbols that currently use the `@store.*`
  per-file alias are rewritten to `@bikerental/shared`. Grounded count — 11 admin `.ts` files
  (including `.spec.ts`) currently import via `@store.*`: the `tariffs/*` files (list, dialog,
  dialog spec, dialog error spec, list spec), the `equipment/*` files (list, dialog, and their
  specs), `equipment-types/equipment-type-dialog.*`, and the `customers/customer-detail/*` files
  (`customer-detail.component`, `customer-layout.store`, `customer-account.component`, and their
  specs). `customer-detail.component.ts` is the canonical mixed-style case: it imports `CustomerStore`
  from the barrel and `CustomerFinanceStore` from `@store.customer-finance.store` in the same file.
* **`operator` (Operator Application):** Two rewrites. (1) The sole remaining deep cross-project
  relative import — `rental-create/step2/discount-input.component.ts` imports `MaxDecimalsDirective`
  from `'../../../../../shared/src/shared/directives/max-decimals.directive'` — is rewritten to
  `@bikerental/shared` (the symbol is already exported from the barrel). (2)
  `app.config.ts` imports `TIME_TRAVEL_STORE_TOKEN` from `@store.time-travel-store.token`; rewritten
  to `@bikerental/shared`.
* **`gateway` (Gateway Application):** No offending imports found today; remains in scope only for
  the lint guard so future regressions are blocked.
* **`shared` (Shared Library):** Subject of the load-bearing decision below. Its 5 internal `@store.*`
  usages must be converted to **relative** intra-library paths, not to `@bikerental/shared` (a barrel
  self-import would reintroduce the FR-03 cyclic-init hazard). Files:
  `core/state/lookup-initializer.facade.ts` (`@store.user.store`),
  `core/mappers/cost-calculation.mapper.ts` (`@store.time.store`),
  `shared/components/equipment-type-dropdown/equipment-type-dropdown.component.ts` and its spec
  (`@store.equipment-type.store`), and
  `shared/components/customer/customer-create-dialog/customer-create-dialog.component.ts`
  (`@store.customer.store`).
* **Root ESLint configuration (`eslint.config.js`):** Gains a `no-restricted-imports` rule with
  scoped overrides (one rule body for application/consumer files, a relaxed body for the shared
  library, and a generated-code exemption). This is the enforcement mechanism for the convention.

## 3. Abstract Data Schema Changes

None. No persisted entity, in-memory state shape, attribute, or relation changes. This is a
build-time/import-graph refactor only. (FR explicitly excludes barrel-export restructuring,
`@store.*` target-folder restructuring, and any store/model logic change.)

## 4. Component Contracts & Payloads

No HTTP, event, or injection-token contract changes. The injection tokens (`RENTAL_STORE_TOKEN`,
`TIME_TRAVEL_STORE_TOKEN`) and every store/service public signature are byte-for-byte identical
after the refactor. The only contract being defined is the **module-resolution convention** between
projects, expressed as a build-time policy rather than a runtime payload.

* **Convention: `admin` / `operator` / `gateway` -> `shared`**
  * **Protocol:** TypeScript module import (build-time path mapping; no runtime wire protocol).
  * **Canonical specifier:** `@bikerental/shared` (the public barrel; `tsconfig.json` path
    `projects/shared/src/public-api.ts`).
  * **Forbidden specifiers:** any deep relative path into the library
    (`*/shared/src/*`, including the `../../../shared/src/...` form), and the `@store.*` per-file
    alias. Both must fail lint.
  * **Disposition decision (`@store.*`):** **Restrict to inside `shared` only** — but converge to
    relative paths there (see below). Outside `shared`, `@store.*` is forbidden entirely.

* **Convention: intra-`shared` imports (`shared` -> `shared`)**
  * **Protocol:** TypeScript module import within one project.
  * **Canonical specifier:** relative module paths (e.g. `./user.store`,
    `../state/time.store`). The shared library must NOT import `@bikerental/shared` (self-import =
    cyclic-init hazard, per FR-03 P-A5), and must NOT use `@store.*` either.

### 4.1 `@store.*` disposition — decision and justification

**Decision: remove `@store.*` from active use everywhere; convert all current usages to relative
paths inside `shared`. The alias definition in `tsconfig.json` may be left in place but is no longer
referenced.**

The FR offers two dispositions: (a) remove the alias entirely, or (b) restrict it to inside the
shared library. The deciding constraint is the FR-03 cyclic-init finding:

* Inside the shared library, the barrel (`@bikerental/shared`) cannot be used for intra-library
  imports without a self-import. So *some* non-barrel specifier is needed inside `shared`.
* The two candidates for that non-barrel specifier are the `@store.*` alias and plain relative
  paths. Both avoid the self-import. However, `@store.*` only covers `core/state/*`, while two of the
  five shared-internal offenders are **outside** `core/state/` (`cost-calculation.mapper.ts` in
  `core/mappers/`, and the dropdown/dialog components in `shared/components/`) yet import store
  symbols. Keeping `@store.*` "for inside shared" would therefore still leave a mix of alias-style
  and relative-style imports within the library, defeating the goal of one consistent style.
* Relative paths are uniform (they work for store↔store, mapper→store, and component→store alike),
  they make the intra-library dependency direction explicit and reviewable, and they remove any
  remaining specifier that resolves shared symbols by a path other than the barrel — eliminating the
  duplicate-class-identity surface entirely.

Net: the library uses **relative paths** internally; `@store.*` becomes dead config. We choose to
**leave the `tsconfig.json` alias definition untouched** (out of scope to restructure aliases per
the FR's "Out of Scope"), but it has zero remaining references and the lint rule forbids re-adopting
it. This is functionally "remove from use" while honoring the out-of-scope boundary on tsconfig
restructuring. (If the team later prefers a clean tsconfig, deleting the now-unused `@store.*` entry
is a trivial follow-up with no code impact.)

## 5. Updated Interaction Sequence

This sequence is the developer/CI workflow, since there is no runtime sequence change.

### Refactor application (one-time)

1. Enumerate offenders (grounded current state):
   * `@store.*` in apps: 11 files in `admin`, 1 in `operator` (`app.config.ts`).
   * `@store.*` in `shared`: 5 files.
   * deep cross-project relative: 1 file (`operator/.../discount-input.component.ts`).
2. For each app/gateway offender: replace the `@store.*` (or deep-relative) specifier with
   `@bikerental/shared`, merging into any existing `@bikerental/shared` import statement in the same
   file so each file has a single barrel import line.
3. For each `shared` offender: replace the `@store.*` specifier with the correct **relative** path to
   the target module. Do not introduce `@bikerental/shared` inside `shared`.
4. Run `npm run fix` (ESLint --fix + Prettier) and the type-checker/build.

### Lint-guard enforcement (ongoing — happy path)

1. Developer edits a file under `projects/admin|operator|gateway` and imports a shared symbol via
   `@bikerental/shared`.
2. ESLint `no-restricted-imports` (consumer scope) finds no forbidden specifier -> passes.
3. CI quality stage passes; build proceeds.

### Lint-guard enforcement (unhappy paths — the acceptance criteria)

1. **Deep relative regression (Scenario 2):** a developer adds
   `import { X } from '../../../shared/src/...'` in any project. The `no-restricted-imports` pattern
   `*/shared/src/*` matches -> `npm run lint` reports an error on that line -> CI fails.
2. **`@store.*` regression in an app:** a developer adds `import { Y } from '@store.foo.store'` in
   `admin`/`operator`/`gateway`. The consumer-scope pattern `@store.*` matches -> lint error -> CI
   fails. The error message names `@bikerental/shared` as the required replacement.
3. **Barrel self-import in `shared`:** a developer adds `import { Z } from '@bikerental/shared'`
   inside `projects/shared/**`. The shared-scope override's pattern `@bikerental/shared` matches ->
   lint error -> CI fails. The message points to using a relative path.
4. **Generated code:** files under `core/api/generated/**` are exempt (already ignored by the root
   config's `ignores`) so regeneration is never blocked.

### DI verification (Scenario 3)

1. After the rewrite, apps build and the existing test suite runs.
2. Because every shared symbol now resolves through a single specifier per scope (barrel for
   consumers, relative for intra-library), each injectable has exactly one class identity ->
   `useExisting`/token providers and `{ provide: X }` overrides resolve as before -> tests pass.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No change. No new data crosses a trust boundary; this is a build-time module
  graph change only.
* **Scale & Performance:**
  * **Module-init safety (load-bearing):** Keeping intra-`shared` imports on relative paths (never
    the public barrel) preserves the FR-03 fix — it keeps the self-referential edge out of the
    library's module graph, eliminating the circular-initialization / duplicate-class-identity class
    of failures. The lint rule actively prevents reintroducing the self-import.
  * **Bundle/identity correctness:** Converging consumers on one specifier removes the
    dual-class-identity risk that can silently break provider aliasing; no measurable bundle-size or
    runtime cost (tree-shaking and lazy boundaries are unaffected — same symbols, same barrel).
  * **CI cost:** The `no-restricted-imports` rule is a cheap AST check folded into the existing lint
    stage; negligible runtime impact on the pipeline.
* **Lint configuration approach (exact specification):**
  * **File:** the single root flat config `eslint.config.js` (typescript-eslint flat config). No
    per-project eslint files exist or are introduced; scoping is done via `files` globs in
    additional config objects.
  * **Rule:** `no-restricted-imports` (core ESLint rule, fully supported in flat config). Chosen over
    a `boundaries`/`@nx`-style plugin because no such plugin is currently installed and the
    convention is expressible with simple glob patterns — avoids adding a dependency for a
    constraint that `no-restricted-imports` already covers (NFR: keep `npm run lint` green with the
    new rule, minimal footprint).
  * **Consumer scope** — applies to the existing `files: ['**/*.ts']` block (covers
    `admin`/`operator`/`gateway`):
    ```js
    'no-restricted-imports': ['error', {
      patterns: [
        {
          group: ['*/shared/src/*', '**/shared/src/**'],
          message: 'Import shared symbols from "@bikerental/shared", not deep relative paths into projects/shared/src.',
        },
        {
          group: ['@store.*'],
          message: 'The @store.* alias is internal to the shared library. Import shared stores from "@bikerental/shared".',
        },
      ],
    }],
    ```
  * **Shared-library override** — a new config object scoped to
    `files: ['projects/shared/**/*.ts']`, listed AFTER the base block so it wins on overlap. It
    forbids the deep-relative path and the barrel self-import, but does NOT forbid `@store.*`-style
    aliases in a way that blocks relative paths (relative paths are always allowed):
    ```js
    {
      files: ['projects/shared/**/*.ts'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['*/shared/src/*', '**/shared/src/**'],
              message: 'Inside the shared library use relative paths, not deep paths into projects/shared/src.',
            },
            {
              group: ['@bikerental/shared'],
              message: 'The shared library must not import its own public barrel (cyclic-init hazard). Use a relative path.',
            },
            {
              group: ['@store.*'],
              message: 'Use relative paths inside the shared library, not the @store.* alias.',
            },
          ],
        }],
      },
    }
    ```
  * **Generated-code exemption:** already handled — `core/api/generated/**` and
    `projects/shared/**/core/api/generated/**` are in the root `ignores` list, so the rule never
    fires on regenerated client code.
  * **Pattern note:** `no-restricted-imports` `group` patterns use gitignore/minimatch-style
    globbing; `@store.*` is matched literally as a prefix-glob (the alias family
    `@store.equipment.store`, `@store.time.store`, …). `*/shared/src/*` plus `**/shared/src/**`
    together catch both the short relative form and arbitrarily deep `../../../shared/src/...` forms.
  * **Concurrency:** N/A (static analysis).
* **Documentation (`AGENTS.md`):** Add a short rule under the "Three-Layer Data Pipeline" / import
  conventions area stating: (1) cross-project code MUST import shared symbols from
  `@bikerental/shared` — never a deep relative path into `projects/shared/src`, never `@store.*`;
  (2) inside the `shared` library, use RELATIVE paths between modules — never the `@bikerental/shared`
  barrel (self-import causes cyclic init) and never `@store.*`; (3) the `no-restricted-imports`
  ESLint rule in the root `eslint.config.js` enforces both and is part of CI, so `npm run lint`
  fails on violations. Mirror the same note in the Claude-specific `CLAUDE.md` import-pattern
  guidance if its conventions section duplicates this, to keep docs in sync per the "Keep docs in
  sync with code" rule.
