# Task 010: PointCreateDialogComponent (New point)

> **Applied Skill:** `angular-component` - standalone `OnPush` dialog, `inject(MatDialogRef)`. AGENTS.md "Admin CRUD Pattern" + the Customers list "create" pattern (`CustomerCreateDialogComponent` closes with the new id; the list navigates). Design FR-01 §2 - a dialog, not a `/points/new` route, so a point whose slug is `new` cannot collide.

## 1. Objective

Create the dialog that hosts `PointProfileFormComponent` in create mode and closes with
`{ slug }` on success (or `undefined` on cancel). The dialog provides its **own**
`PointAdminStore`, because `MatDialog` resolves dialog dependencies from the root injector, not
from the page that opened it (same reason `CustomerCreateDialogComponent` provides its own
`CustomerStore`).

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-create-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file `projects/admin/src/app/points/point-create-dialog.component.ts` - full content.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Labels, type Point, PointAdminStore } from '@bikerental/shared';
import { PointProfileFormComponent } from './point-profile-form.component';

export interface PointCreateDialogResult {
  readonly slug: string;
}

@Component({
  selector: 'app-point-create-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointAdminStore],
  imports: [MatDialogModule, PointProfileFormComponent],
  template: `
    <h2 mat-dialog-title>{{ labels.PointRegisterTitle }}</h2>
    <mat-dialog-content>
      <app-point-profile-form [mode]="'create'" (saved)="close($event)" (cancelled)="dismiss()" />
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

  protected dismiss(): void {
    this.dialogRef.close();
  }
}
```

Behaviour:
* Success toast "Rental point saved" is shown by the form itself (task-009); the dialog adds none.
* Duplicate slug: the form binds the server error to the slug field and the dialog stays open.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-create-dialog.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
