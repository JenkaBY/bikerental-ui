# Task 007: `PointCreateDialogComponent` ("New point" dialog)

> **Applied Skill:** `angular-component` - standalone `OnPush` dialog, `inject()` for `MatDialogRef`. `angular-di` - the dialog provides its own `PointAdminStore` instance (same pattern as `CustomerCreateDialogComponent`, which provides `CustomerStore`), so it does not depend on the opener's injector. AGENTS.md *Admin CRUD Pattern* - dialog closes with a result on success, `undefined` on cancel.

## 1. Objective

Create the dialog opened by the "New point" button. It hosts `PointProfileFormComponent` in `mode="create"`. On successful save it closes with `{ slug }` (the form already shows the `Labels.PointSaved` success toast and handles errors with the global toast suppressed). On Cancel it closes with `undefined`. A dialog is used instead of a `/points/new` route so it can never collide with a point whose slug is literally `new`.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-create-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/admin/src/app/points/point-create-dialog.component.ts`
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Labels, type Point, PointAdminStore } from '@bikerental/shared';
import { PointProfileFormComponent } from './point-profile-form.component';

export interface PointCreateDialogResult {
  slug: string;
}

@Component({
  selector: 'app-point-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointAdminStore],
  imports: [MatDialogModule, PointProfileFormComponent],
  template: `
    <h2 mat-dialog-title>{{ labels.PointRegisterTitle }}</h2>
    <mat-dialog-content>
      <div class="pt-1">
        <app-point-profile-form mode="create" (saved)="close($event)" (cancelled)="cancel()" />
      </div>
    </mat-dialog-content>
  `,
})
export class PointCreateDialogComponent {
  protected readonly labels = Labels;

  private readonly dialogRef =
    inject<MatDialogRef<PointCreateDialogComponent, PointCreateDialogResult>>(MatDialogRef);

  protected close(point: Point): void {
    this.dialogRef.close({ slug: point.slug });
  }

  protected cancel(): void {
    this.dialogRef.close();
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint admin
```
