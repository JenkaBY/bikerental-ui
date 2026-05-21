# Task 005: Create `BrokenEquipmentSheetComponent` Stub and `RentalActionButtonsComponent`

> **Applied Skill:** `angular-component` — New standalone `OnPush` component; injects `RentalStore`, `MatDialog`, `MatBottomSheet`, `MatSnackBar`, `Router`, `DestroyRef`; handles return/cancel lifecycle operations with Observable subscriptions via `takeUntilDestroyed()`. The `BrokenEquipmentSheetComponent` stub satisfies the import at compile time; FR-13 will replace it with the full implementation.

## 1. Objective

Create the action button bar rendered at the bottom of the Rental Detail page. For ACTIVE rentals it shows three controls: "Return equipment (N)" (full-width primary), "🔧 Broken" (left half, red outline), and "Cancel rental" (right half, amber). For DEBT rentals only the full-width "🔧 Broken" button is shown.

## 2. File to Modify / Create

### File A — `BrokenEquipmentSheetComponent` stub (placeholder for FR-13)

* **File Path:** `projects/operator/src/app/rental-detail/broken-equipment-sheet.component.ts`
* **Action:** Create New File

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-broken-equipment-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class BrokenEquipmentSheetComponent {
}
```

> **FR-13 dependency:** FR-13 will replace the body of this file with the full bottom-sheet implementation. The empty template prevents render errors while the feature is incomplete.

---

### File B — `RentalActionButtonsComponent`

* **File Path:** `projects/operator/src/app/rental-detail/rental-action-buttons.component.ts`
* **Action:** Create New File

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Labels, RentalStore } from '@bikerental/shared';
import { BrokenEquipmentSheetComponent } from './broken-equipment-sheet.component';
import { CancelRentalDialogComponent } from './cancel-rental-dialog.component';

@Component({
  selector: 'app-rental-action-buttons',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="flex flex-col gap-2 px-4 py-3 border-t border-slate-200 bg-white shrink-0">
      @if (store.isActive()) {
        <button
          mat-flat-button
          color="primary"
          class="w-full"
          [disabled]="isReturnDisabled()"
          (click)="onReturn()"
        >
          @if (store.isReturning()) {
            <mat-spinner diameter="20" />
          } @else {
            {{ Labels.ReturnEquipmentButton }} ({{ store.selectedEquipmentCount() }})
          }
        </button>

        <div class="flex gap-2">
          <button
            mat-stroked-button
            class="flex-1 text-red-600 border-red-400"
            (click)="onBroken()"
          >
            🔧 {{ Labels.BrokenEquipment }}
          </button>
          <button
            mat-flat-button
            class="flex-1 bg-amber-400 text-white"
            [disabled]="store.isSaving()"
            (click)="onCancel()"
          >
            {{ Labels.CancelRental }}
          </button>
        </div>
      }

      @if (store.isDebt()) {
        <button
          mat-stroked-button
          class="w-full text-red-600 border-red-400"
          (click)="onBroken()"
        >
          🔧 {{ Labels.BrokenEquipment }}
        </button>
      }
    </div>
  `,
})
export class RentalActionButtonsComponent {
  protected readonly store = inject(RentalStore);
  private readonly dialog = inject(MatDialog);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly Labels = Labels;

  protected readonly isReturnDisabled = computed(
    () => this.store.selectedEquipmentCount() === 0 || this.store.isReturning(),
  );

  protected onReturn(): void {
    this.store
      .returnEquipment()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.snackBar.open(Labels.RentalReturnSuccess, undefined, { duration: 3000 });
          this.router.navigate(['/rentals']);
        },
        error: () => {
          this.snackBar.open(Labels.RentalReturnError, Labels.Close, { duration: 5000 });
        },
      });
  }

  protected onBroken(): void {
    this.bottomSheet.open(BrokenEquipmentSheetComponent, {
      data: {
        equipmentItems: this.store.rentalEquipmentItems(),
        brokenEquipmentEntries: this.store.brokenEquipmentEntries(),
      },
    });
  }

  protected onCancel(): void {
    this.dialog
      .open(CancelRentalDialogComponent, { disableClose: false })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed: boolean | undefined) => {
        if (!confirmed) return;
        this.store
          .cancelRental()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe({
            next: () => {
              this.snackBar.open(Labels.RentalCancelSuccess, undefined, { duration: 3000 });
              this.router.navigate(['/rentals']);
            },
            error: () => {
              this.snackBar.open(Labels.RentalCancelError, Labels.Close, { duration: 5000 });
            },
          });
      });
  }
}
```

### Key design decisions

| Decision                                          | Rationale                                                                                                  |
|---------------------------------------------------|------------------------------------------------------------------------------------------------------------|
| `isReturnDisabled` as `computed()`                | Reactive derivation; Angular template auto-detects changes without manual `changeDetection.markForCheck()` |
| `takeUntilDestroyed(this.destroyRef)`             | Prevents subscription leaks if the component is destroyed mid-flight                                       |
| Nested `takeUntilDestroyed` inside cancel confirm | The inner subscription starts only after dialog confirmation; it needs its own destroy guard               |
| `snackBar.open(msg, undefined, ...)`              | `undefined` as action label hides the action button; shows only the message with auto-dismiss              |
| `router.navigate(['/rentals'])`                   | Navigates to the Active tab (default route, no filter param) after any successful operation                |
| `store.isReturning()` in `isReturnDisabled`       | Prevents double-submission during the in-flight API call                                                   |

## 4. Validation Steps

skip
