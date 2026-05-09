# Task 015: Create `RentalStep2Component` (Smart Orchestrator)

> **Applied Skill:** `angular-component`, `angular-signals` — Smart orchestrator. Does NOT re-declare `providers: [RentalStore]` — it resolves the instance from `RentalCreateComponent`'s injector. Opens `TopUpDialogComponent` on `topUpRequested`. Handles `nextRequested` and `saveDraftRequested` from the footer. Emits `stepAdvanced` for the parent stepper on successful save.

> **⚠️ Prerequisites:** All child components (task-010 through task-014) must be created first.

## 1. Objective

Create the orchestrating component for Step 2. It composes all section components and the sticky footer, opens the top-up dialog when requested, and manages draft save + stepper advancement.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-step2.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, of, tap } from 'rxjs';
import { Labels, RentalStore } from '@bikerental/shared';
import { RentalCustomerPanelComponent } from './rental-customer-panel.component';
import { RentalDurationControlComponent } from './rental-duration-control.component';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';
import { RentalPricingSectionComponent } from './rental-pricing-section.component';
import { RentalCostFooterComponent } from './rental-cost-footer.component';

// TopUpDialogComponent is provided by the shared module (FR-07).
// Import it once that task is completed:
// import { TopUpDialogComponent } from '@bikerental/shared';

@Component({
  selector: 'app-rental-step2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RentalCustomerPanelComponent,
    RentalDurationControlComponent,
    RentalEquipmentSectionComponent,
    RentalPricingSectionComponent,
    RentalCostFooterComponent,
  ],
  template: `
    <!-- Add padding-bottom equal to footer height so content is not obscured -->
    <div class="flex flex-col gap-6 pb-36">
      <app-rental-customer-panel (topUpRequested)="onTopUpRequested()" />
      <app-rental-duration-control />
      <app-rental-equipment-section />
      <app-rental-pricing-section />
    </div>
    <app-rental-cost-footer
      (nextRequested)="onNext()"
      (saveDraftRequested)="onSaveDraft()"
    />
  `,
})
export class RentalStep2Component {
  private readonly store = inject(RentalStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly stepAdvanced = output<void>();

  protected onTopUpRequested(): void {
    const customerId = this.store.customer()?.id;
    if (!customerId) return;

    // TODO (FR-07): Replace null with TopUpDialogComponent once it is available in shared.
    // this.dialog
    //   .open(TopUpDialogComponent, { data: { customerId }, disableClose: true })
    //   .afterClosed()
    //   .pipe(takeUntilDestroyed(this.destroyRef))
    //   .subscribe((result) => {
    //     if (result === true) this.store.refreshCustomerBalance();
    //   });
  }

  protected onSaveDraft(): void {
    this.store.save()
      .pipe(
        tap(() => this.snackBar.open(Labels.DraftSaved, Labels.Close, { duration: 3000 })),
        catchError(() => of(undefined)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onNext(): void {
    this.store.save()
      .pipe(
        tap(() => this.stepAdvanced.emit()),
        catchError(() => of(undefined)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
```

> **Note on `TopUpDialogComponent`:** The dialog is part of FR-07. Until that task is complete, `onTopUpRequested()` is a no-op. The commented-out block shows the expected implementation to be uncommented once FR-07 is done.

> **Note on `RentalStore` injection:** `RentalStep2Component` does NOT declare `providers: [RentalStore]`. The store instance is provided by `RentalCreateComponent` (the parent smart component that owns the full create flow). Angular's DI will resolve it from the parent injector automatically.

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
