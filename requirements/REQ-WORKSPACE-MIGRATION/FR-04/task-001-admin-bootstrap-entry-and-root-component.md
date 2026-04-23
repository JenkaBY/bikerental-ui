# Task 001: Create Admin Bootstrap Entry Point and Root App Component

> **Applied Skill:** `angular-component` — standalone component, `ChangeDetectionStrategy.OnPush`, no `standalone: true` flag needed in v20+.
> **Applied Skill:** `angular-routing` — `RouterOutlet` imported directly on the root component.

## 1. Objective

Create `projects/admin/src/main.ts` (bootstrap entry point) and `projects/admin/src/app/app.ts` (minimal root `App` component). These are direct mirrors of the gateway equivalents — the admin entry point bootstraps the admin-specific `appConfig` and `App`.

## 2. Files to Create

| # | File Path                       | Action          |
|---|---------------------------------|-----------------|
| 1 | `projects/admin/src/main.ts`    | Create New File |
| 2 | `projects/admin/src/app/app.ts` | Create New File |

---

## 3. Code Implementation

### File 1 — `projects/admin/src/main.ts`

```typescript
/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

### File 2 — `projects/admin/src/app/app.ts`

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
# Confirm both files exist
Test-Path "projects\admin\src\main.ts"
Test-Path "projects\admin\src\app\app.ts"

# TypeScript parse-check (no errors expected at this stage — app.config.ts/app.routes.ts are added in later tasks)
npx tsc -p projects/admin/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: both `Test-Path` return `True`. TypeScript errors about missing `app.config` and `app.routes` are expected at this stage and will be resolved by Tasks 002–003.
