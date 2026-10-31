# Task 014: Empty Cash and Collections tab components (content in FR-03 / FR-04)

> **Applied Skill:** `angular-routing` - every tab is a deep-linkable lazy child route (FR-02 Scenario 2 needs `/points/:slug/transfers` to activate). `angular-component` - standalone `OnPush`. Boundary: FR-03 fills `PointCashTabComponent`, FR-04 fills `PointTransfersTabComponent`; FR-02 only creates the route targets, with no visible text (so no labels).

## 1. Objective

Create the two route components with their final names and paths so FR-03/FR-04 modify them
instead of re-wiring routes.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-cash-tab.component.ts` - **Action:** Create New File
* **File Path:** `projects/admin/src/app/points/point-transfers-tab.component.ts` - **Action:** Create New File

## 3. Code Implementation

* **Location:** New file `projects/admin/src/app/points/point-cash-tab.component.ts` - full content.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-point-cash-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="p-4 md:p-6"></div>`,
})
export class PointCashTabComponent {}
```

* **Location:** New file `projects/admin/src/app/points/point-transfers-tab.component.ts` - full content.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-point-transfers-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="p-4 md:p-6"></div>`,
})
export class PointTransfersTabComponent {}
```

If `npx ng lint admin` reports `@typescript-eslint/no-extraneous-class` for these empty classes,
add `protected readonly tab = 'cash';` / `protected readonly tab = 'transfers';` as the only class
member and re-run (no other change).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-cash-tab.component.ts projects/admin/src/app/points/point-transfers-tab.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
