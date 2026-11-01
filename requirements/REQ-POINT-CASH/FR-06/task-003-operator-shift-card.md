# Task 003: OperatorShiftCardComponent (dumb)

> **Applied Skill:** `angular-component` - standalone, OnPush, `input()`/`output()`, template under 100 lines. `angular-signals` - `computed` caption. AGENTS.md "Shared Import Convention" - one `@bikerental/shared` import. Components import only domain types (`RunningShift`, `ActionAvailability`). i18n - all text from `Labels` (reused entries + `Labels.OperatorHandInCash`). Mirrors `projects/admin/src/app/points/point-cash-card.component.ts`.

## 1. Objective

Dumb card for the operator Cash screen:

* caption "Shift N · opened HH:mm" via `pointShiftCaption()`;
* `ShiftBreakdownComponent` with `prominentExpected`;
* primary "Hand in cash" (hidden when `collection().reason === 'HIDDEN'`, disabled unless `collection().enabled`), full width, 48px high;
* the active-point hint when `collection().reason === 'POINT_NOT_ACTIVE'`;
* secondary "Close shift" (hidden when `closeShift().reason === 'HIDDEN'`), full width, 48px high;
* outputs `handIn` and `closeShiftRequested` (an output cannot share the name of the `closeShift` input).

Requires task-001.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/operator-shift-card.component.ts` - **Action:** Create New File

## 3. Code Implementation

* **Location:** new file, whole content:

```typescript
import { formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  output,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  type ActionAvailability,
  Labels,
  pointShiftCaption,
  type RunningShift,
  ShiftBreakdownComponent,
} from '@bikerental/shared';

const OPENED_TIME_FORMAT = 'HH:mm';

@Component({
  selector: 'app-operator-shift-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, ShiftBreakdownComponent],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-4">
      <div class="text-sm text-slate-500">{{ caption() }}</div>
      <app-shift-breakdown [shift]="shift()" [prominentExpected]="true" />

      <div class="flex flex-col gap-3">
        @if (collection().reason !== 'HIDDEN') {
          <button
            mat-flat-button
            type="button"
            class="!h-12 w-full"
            [disabled]="!collection().enabled"
            (click)="handIn.emit()"
          >
            {{ labels.OperatorHandInCash }}
          </button>
        }
        @if (collection().reason === 'POINT_NOT_ACTIVE') {
          <p class="m-0 text-sm text-slate-500">{{ labels.PointCollectionNotActiveHint }}</p>
        }
        @if (closeShift().reason !== 'HIDDEN') {
          <button
            mat-stroked-button
            type="button"
            class="!h-12 w-full"
            [disabled]="!closeShift().enabled"
            (click)="closeShiftRequested.emit()"
          >
            {{ labels.PointCloseShift }}
          </button>
        }
      </div>
    </section>
  `,
})
export class OperatorShiftCardComponent {
  private readonly locale = inject(LOCALE_ID);

  protected readonly labels = Labels;

  readonly shift = input.required<RunningShift>();
  readonly collection = input.required<ActionAvailability>();
  readonly closeShift = input.required<ActionAvailability>();

  readonly handIn = output<void>();
  readonly closeShiftRequested = output<void>();

  protected readonly caption = computed(() => {
    const current = this.shift();
    return pointShiftCaption(
      current.sequence,
      formatDate(current.openedAt, OPENED_TIME_FORMAT, this.locale),
    );
  });
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/operator-shift-card.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
