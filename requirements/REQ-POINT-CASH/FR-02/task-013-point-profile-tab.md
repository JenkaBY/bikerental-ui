# Task 013: PointProfileTabComponent (profile form + status actions)

> **Applied Skill:** `angular-component` - thin smart tab, reads the host-scoped store via `inject()`. Design FR-02 §2 - Profile tab hosts `PointProfileFormComponent` (view/edit) and the relocated, unchanged `PointStatusActionsComponent`; both write through the host's `PointAdminStore`, so the header (name, address, status pill) updates without a reload (Scenarios 5, 6).

## 1. Objective

Create the `profile` tab route component.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-profile-tab.component.ts`
* **Action:** Create New File

## 3. Code Implementation

* **Location:** New file - full content.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PointAdminStore } from '@bikerental/shared';
import { PointProfileFormComponent } from './point-profile-form.component';
import { PointStatusActionsComponent } from './point-status-actions.component';

@Component({
  selector: 'app-point-profile-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PointProfileFormComponent, PointStatusActionsComponent],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-4">
      @if (points.selected(); as point) {
        <div class="flex justify-end">
          <app-point-status-actions [point]="point" />
        </div>
        <app-point-profile-form [mode]="'edit'" [point]="point" />
      }
    </div>
  `,
})
export class PointProfileTabComponent {
  protected readonly points = inject(PointAdminStore);
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-profile-tab.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
