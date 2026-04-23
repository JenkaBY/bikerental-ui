# Task 001: Create Operator Bootstrap Entry Point and Root App Component

> **Applied Skill:** `angular-component` — standalone component, `ChangeDetectionStrategy.OnPush`, `RouterOutlet`.
> **Applied Skill:** `angular-routing` — `RouterOutlet` imported directly on the root component.

## 1. Objective

Create `projects/operator/src/main.ts` (bootstrap entry point) and `projects/operator/src/app/app.ts` (minimal root `App` component). These mirror the admin equivalents — the operator entry point bootstraps the operator-specific `appConfig` and `App`.

## 2. Files to Create

| # | File Path                          | Action          |
|---|------------------------------------|-----------------|
| 1 | `projects/operator/src/main.ts`    | Create New File |
| 2 | `projects/operator/src/app/app.ts` | Create New File |

---

## 3. Code Implementation

### File 1 — `projects/operator/src/main.ts`

```typescript
/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

### File 2 — `projects/operator/src/app/app.ts`

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {
}
```

---

## 4. Validation Steps

```powershell
# TypeScript parse-check — errors about missing ./app/app.config and ./app/app.routes are expected until Tasks 002–003 complete
npx tsc -p projects/operator/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: only `Cannot find module './app/app.config'` and `Cannot find module './app/app'` errors (resolved in Tasks 002–003). No `@angular/core` or `RouterOutlet` errors.
