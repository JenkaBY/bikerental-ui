# Task 003: Create `projects/shared/src/public-api.ts` Barrel File

> **Applied Skill:** `angular-tooling` — Angular library public API barrel pattern; `entryFile` convention for `ng-packagr` and internal path-alias libraries.

## 1. Objective

Create the `public-api.ts` barrel file that re-exports every symbol that application projects (`gateway`, `admin`, `operator`) need to import from `@bikerental/shared`. This file is the single entry point for the `@bikerental/shared` path alias defined in `tsconfig.json` (added in task-005).

**Prerequisite:** Tasks 001 and 002 must be complete — all source files must exist under `projects/shared/src/` before this barrel is created.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** N/A — barrel file uses `export *` only.

**Code to Add/Replace:**

* **Location:** Create the file at `projects/shared/src/public-api.ts` with the exact content below.

```typescript
// App-level tokens (APP_BRAND, BRAND)
export * from './app.tokens';

// Core — generated API client (providers, services, models, tokens, utils)
export * from './core/api/generated';

// Core — health monitoring
export * from './core/health/health.model';
export * from './core/health/health.service';
export * from './core/health/health-poller.service';

// Core — HTTP interceptors
export * from './core/interceptors/error.interceptor';
export * from './core/interceptors/error.service';

// Core — layout mode
export * from './core/layout-mode.service';

// Core — mappers
export * from './core/mappers';

// Core — domain models
export * from './core/models';

// Core — signal state stores
export * from './core/state/equipment-status.store';
export * from './core/state/equipment-type.store';
export * from './core/state/equipment.store';
export * from './core/state/pricing-type.store';
export * from './core/state/tariff.store';
export * from './core/state/lookup-initializer.facade';

// Shared UI — components
export * from './shared/components/app-brand/app-brand.component';
export * from './shared/components/app-toolbar/app-toolbar.component';
export * from './shared/components/bottom-nav/bottom-nav.component';
export * from './shared/components/bottom-nav-item/bottom-nav-item.component';
export * from './shared/components/button/button.component';
export * from './shared/components/cancel-button/cancel-button.component';
export * from './shared/components/dashboard-card/dashboard-card.component';
export * from './shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
export * from './shared/components/health-indicator/health-indicator.component';
export * from './shared/components/health-indicator/health-tooltip-line.component';
export * from './shared/components/health-indicator/health-tooltip-lines.builder';
export * from './shared/components/health-indicator/health-tooltip.component';
export * from './shared/components/layout-mode-toggle/layout-mode-toggle.component';
export * from './shared/components/logout-button/logout-button.component';
export * from './shared/components/save-button/save-button.component';
export * from './shared/components/shell/shell.component';
export * from './shared/components/sidebar/sidebar.component';
export * from './shared/components/sidebar-nav-item/nav-item.model';
export * from './shared/components/sidebar-nav-item/sidebar-nav-item.component';
export * from './shared/components/toggle-button/toggle-button.component';

// Shared UI — constants
export * from './shared/constant/labels';

// Shared UI — pipes
export * from './shared/pipes/truncate.pipe';

// Shared UI — utilities
export * from './shared/utils/date.util';

// Shared UI — validators
export * from './shared/validators/form-error-messages';
export * from './shared/validators/slug-validators';
```

> **Note on export conflicts:** If any two files export a symbol with the same name, TypeScript will report an `export * conflict` error. In that case, replace the offending `export *` line with a named `export { SpecificSymbol } from '...'` for only the symbols that are unique to that file. Do not resolve conflicts by removing entire lines — identify the conflicting symbol name from the compiler error and exclude only that one.

## 4. Validation Steps

```powershell
# Confirm the file was created
Test-Path "projects\shared\src\public-api.ts"

# TypeScript: parse the barrel for syntax errors
npx tsc -p projects/shared/tsconfig.lib.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: `Test-Path` returns `True`. The `tsc` command exits with no `error TS` lines.

> At this stage the tsconfig alias `@bikerental/shared` does not yet exist (added in task-005). TypeScript may report "cannot find module" errors for imports inside the copied core/shared files that used old relative paths — those are expected and will be resolved in FR-03/FR-04/FR-05. The goal here is zero **syntax** errors in `public-api.ts` itself.
