# Task 014: Create `RentalCostFooterComponent` (Smart)

> **Applied Skill:** `angular-component`, `angular-signals` — Smart sticky footer. Injects `RentalStore` (resolved from parent injector). Reads cost/balance/proceed signals. Emits `nextRequested` and `saveDraftRequested` outputs — the parent handles actual store calls. `position: fixed` at the bottom with padding matching footer height added by the parent.

## 1. Objective

Create the always-visible sticky cost footer that displays the total cost estimate (spinner while loading), projected balance, and an insufficient-balance warning. Has "Save Draft" and "Next" buttons whose disabled state is driven by store signals.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-cost-footer.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Labels, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-cost-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule, MatChipsModule, CurrencyPipe],
  host: {
    class: 'fixed bottom-0 left-0 right-0 z-10',
  },
  template: `
    <div class="bg-white border-t border-slate-200 shadow-lg px-4 py-3 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-600">{{ Labels.TotalCost }}</span>
        @if (store.costEstimate(); as cost) {
          <span class="font-semibold text-slate-900">
            {{ cost.amount | currency: cost.currency }}
          </span>
        } @else {
          <mat-spinner diameter="20" />
        }
      </div>

      @if (store.projectedBalance(); as projected) {
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">{{ Labels.ProjectedBalance }}</span>
          <span class="font-medium" [class.text-red-600]="!store.isBalanceSufficient()">
            {{ projected.amount | currency: projected.currency }}
          </span>
        </div>
      }

      @if (!store.isBalanceSufficient()) {
        <div class="text-xs font-medium text-red-600 bg-red-50 rounded px-2 py-1">
          {{ Labels.InsufficientBalance }}
        </div>
      }

      <div class="flex gap-2 mt-1">
        <button
          mat-stroked-button
          type="button"
          class="flex-1"
          [disabled]="store.isSaving()"
          (click)="saveDraftRequested.emit()"
        >
          @if (store.isSaving()) {
            {{ Labels.Saving }}
          } @else {
            {{ Labels.SaveDraft }}
          }
        </button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          class="flex-1"
          [disabled]="!store.canProceedFromStep2() || store.isSaving()"
          (click)="nextRequested.emit()"
        >
          {{ Labels.Next }}
        </button>
      </div>
    </div>
  `,
})
export class RentalCostFooterComponent {
  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;

  readonly nextRequested = output<void>();
  readonly saveDraftRequested = output<void>();
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
