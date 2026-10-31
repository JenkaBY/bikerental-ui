# Task 010: `PointProfileTabComponent` (Profile tab: edit form + status actions)

> **Applied Skill:** `angular-component` - standalone, `OnPush`, `inject()`; the tab is a thin smart wrapper that reads the HOST-scoped `PointAdminStore` (provided by `PointDetailPageComponent`, Task 012) and passes the selected point to dumb/child components. `angular-di` - no `providers` here: the tab must share the host's store instance so header name/status update reactively. Reuse over rewrite - `PointProfileFormComponent` (FR-01 Task 006) and `PointStatusActionsComponent` (existing) are used unchanged.

## 1. Objective

Create the `profile` tab content:

* `PointStatusActionsComponent` (activate / deactivate / close permanently, unchanged rules). On success `PointAdminStore.changeStatus` replaces the point, so the header status pill and `canTransferFromPoint` update immediately (FR-02 Scenario 6).
* `PointProfileFormComponent` in `mode="edit"` bound to the selected point: view mode by default, Edit button, same fields/validators/server-error binding (incl. `point.slug.duplicate` on the slug field) and `Labels.PointSaved` toast. `PointAdminStore.update` replaces the point and leaves edit mode, so the header title/address update without reload (FR-02 Scenario 5).

Nothing is rendered until the host has loaded the point (`selected()` is `null` before that).

**Precondition:** FR-01 Task 006 is done (`projects/admin/src/app/points/point-profile-form.component.ts` exists). If not, STOP and report.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/detail/point-profile-tab.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/admin/src/app/points/detail/point-profile-tab.component.ts`
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PointAdminStore } from '@bikerental/shared';
import { PointProfileFormComponent } from '../point-profile-form.component';
import { PointStatusActionsComponent } from '../point-status-actions.component';

@Component({
  selector: 'app-point-profile-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PointProfileFormComponent, PointStatusActionsComponent],
  template: `
    @if (registry.selected(); as point) {
      <div class="p-4 md:p-6 flex flex-col gap-4">
        <div class="flex justify-end">
          <app-point-status-actions [point]="point" />
        </div>
        <app-point-profile-form mode="edit" [point]="point" />
      </div>
    }
  `,
})
export class PointProfileTabComponent {
  protected readonly registry = inject(PointAdminStore);
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server. (The component is not routed yet; it is fully type-checked by the build once Task 013 adds the route.)

```bash
npx prettier --write projects/admin/src/app/points/detail/point-profile-tab.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
