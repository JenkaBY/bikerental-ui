# Task 002: Rewrite operator `@store.*` and deep-relative shared imports to `@bikerental/shared`

> **Applied Skill:** `typescript-es2022` (SKILL.md §"General guardrails" — pure ES modules, single
> canonical module specifier) + the AGENTS.md cross-project import rule (`@bikerental/shared` only).
> Enforces FR-04 Scenario 1 for the `operator` project and removes the last deep cross-project
> relative import (FR-04 Scenario 2 target pattern).

## 1. Objective

Rewrite the two remaining offending imports in the `operator` project: (1) the
`@store.time-travel-store.token` alias in `app.config.ts`, and (2) the deep cross-project relative
import of `MaxDecimalsDirective` in `discount-input.component.ts`. Both become `@bikerental/shared`,
merging into the file's existing barrel import line. Pure import-path refactor — no other changes.

## 2. Files to Modify

1. `D:\Workspace\private\bikerental-ui\projects\operator\src\app\app.config.ts`
2. `D:\Workspace\private\bikerental-ui\projects\operator\src\app\rental-create\step2\discount-input.component.ts`

- **Action:** Modify Existing Files

Both target symbols are confirmed exported from `projects/shared/src/public-api.ts`:
`time-travel-store.token` (line 51 → `TIME_TRAVEL_STORE_TOKEN`) and `max-decimals.directive`
(line 96 → `MaxDecimalsDirective`).

## 3. Code Implementation

### File 1 — `app.config.ts`

`TIME_TRAVEL_STORE_TOKEN` comes via `@store.*` on line 25; merge it into the existing barrel block
(lines 13–24) in alphabetical position and delete line 25.

**OLD (barrel block, lines 13–24):**

```ts
import {
  APP_BRAND,
  BRAND,
  environment,
  errorInterceptor,
  HealthPollerService,
  LookupInitializerFacade,
  provideDefaultClient,
  SseService,
  SSE_PROVIDER,
  TimeTravelStore,
} from '@bikerental/shared';
import { TIME_TRAVEL_STORE_TOKEN } from '@store.time-travel-store.token';
```

**NEW (replace both — the block + the `@store.*` line on line 25):**

```ts
import {
  APP_BRAND,
  BRAND,
  environment,
  errorInterceptor,
  HealthPollerService,
  LookupInitializerFacade,
  provideDefaultClient,
  SseService,
  SSE_PROVIDER,
  TIME_TRAVEL_STORE_TOKEN,
  TimeTravelStore,
} from '@bikerental/shared';
```

> Ordering note: `npm run fix` will re-sort the named imports per Prettier/ESLint if the placement
> above differs. The exact position inside the braces is not load-bearing; the single barrel line is.

### File 2 — `discount-input.component.ts`

`Labels` is already imported from the barrel (line 5); `MaxDecimalsDirective` is the deep relative
import (line 6). Merge into one barrel line.

**OLD (lines 5–6):**

```ts
import { Labels } from '@bikerental/shared';
import { MaxDecimalsDirective } from '../../../../../shared/src/shared/directives/max-decimals.directive';
```

**NEW (lines 5–6 → single line):**

```ts
import { Labels, MaxDecimalsDirective } from '@bikerental/shared';
```

## 4. Validation Steps

Execute from the repo root `D:\Workspace\private\bikerental-ui`. Do NOT start the dev server, run
E2E, or inspect databases.

```bash
npm run fix
npm run build
npm test
```

`npm run build` must compile clean (proves both barrel symbols resolve and the deep-relative path is
gone). `npm test` must stay green. Confirm no `@store.` substring and no `shared/src/` relative path
remain anywhere under `projects/operator` before moving on.
