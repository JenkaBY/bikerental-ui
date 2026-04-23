# Task 001: Create Gateway Bootstrap Entry Point and Root App Component

> **Applied Skill:** `angular-component` — standalone component without NgModules; no `standalone: true` flag (it is the default in v20+).
> **Applied Skill:** `angular-routing` — `RouterOutlet` imported directly on the root component.

## 1. Objective

Create the gateway-specific `projects/gateway/src/main.ts` bootstrap entry point and the minimal `App` root component at `projects/gateway/src/app/app.ts`. These are direct copies of the existing `src/main.ts` and `src/app/app.ts` with import paths updated to be self-contained inside the gateway project tree.

## 2. Files to Create

### File 1

* **File Path:** `projects/gateway/src/main.ts`
* **Action:** Create New File

### File 2

* **File Path:** `projects/gateway/src/app/app.ts`
* **Action:** Create New File

---

## 3. Code Implementation

### `projects/gateway/src/main.ts`

```typescript
/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

### `projects/gateway/src/app/app.ts`

No changes to the component's behaviour — only the `templateUrl`/`styleUrl` references must use relative paths that resolve within `projects/gateway/src/app/`.

The root component uses an inline template (no separate HTML file required at this stage):

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class App {}
```

> **Note:** The original `src/app/app.ts` had an external `templateUrl` and `styleUrl`. The gateway version uses an inline template to avoid creating redundant HTML/CSS files. No visual behaviour changes.

---

## 4. Validation Steps

```powershell
# Confirm both files exist
Test-Path "projects\gateway\src\main.ts"
Test-Path "projects\gateway\src\app\app.ts"

# TypeScript parse-check
npx tsc -p projects/gateway/tsconfig.app.json --noEmit
```

Expected: both `Test-Path` return `True`; `tsc` produces no errors.
