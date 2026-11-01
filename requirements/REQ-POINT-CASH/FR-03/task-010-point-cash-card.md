# Task 010: PointCashCardComponent (admin, dumb)

> **Applied Skill:** `angular-component` - standalone, `OnPush`, `input()` / `output()`, native `@switch`. AGENTS.md - dumb component imports only `core/models` domain types via `@bikerental/shared`; i18n via `Labels` / `pointShiftCaption`; no comments. Design FR-03 section 2.

## 1. Objective

Show the CASH position (prominent), and by shift state: `loading` progress bar; `running` caption
"Shift N · opened HH:mm" + `ShiftBreakdownComponent`; `none` "No shift is running"; `failed` the
shift error text. "Collect cash" / "Close shift" buttons render unless their availability is
`HIDDEN`; a disabled collection with reason `POINT_NOT_ACTIVE` shows the localized hint.

Requires tasks 001, 005, 006, 009.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-cash-card.component.ts` - **Action:** Create New File

## 3. Code Implementation

* **Location:** New file `projects/admin/src/app/points/point-cash-card.component.ts` - full content.
* **Snippet:**

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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  type ActionAvailability,
  FixedMoneyPipe,
  Labels,
  type Money,
  pointShiftCaption,
  type RunningShift,
  type RunningShiftState,
  ShiftBreakdownComponent,
} from '@bikerental/shared';

const OPENED_TIME_FORMAT = 'HH:mm';

@Component({
  selector: 'app-point-cash-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressBarModule, FixedMoneyPipe, ShiftBreakdownComponent],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <h2 class="m-0 text-base font-semibold text-slate-700">{{ labels.PointCashCardTitle }}</h2>
      <div class="text-3xl font-semibold tabular-nums">{{ cash() | fixedMoney }}</div>

      @switch (shiftState()) {
        @case ('loading') {
          <mat-progress-bar mode="indeterminate" />
        }
        @case ('running') {
          @if (shift(); as current) {
            <div class="text-sm text-slate-500">{{ caption() }}</div>
            <app-shift-breakdown [shift]="current" />
          }
        }
        @case ('none') {
          <p class="m-0 text-slate-400">{{ labels.PointShiftNone }}</p>
        }
        @case ('failed') {
          <p class="m-0 text-slate-400">{{ labels.PointShiftLoadFailed }}</p>
        }
      }

      <div class="flex flex-wrap gap-2">
        @if (collection().reason !== 'HIDDEN') {
          <button
            mat-flat-button
            type="button"
            [disabled]="!collection().enabled"
            (click)="collect.emit()"
          >
            {{ labels.PointCollectCash }}
          </button>
        }
        @if (closeShift().reason !== 'HIDDEN') {
          <button
            mat-stroked-button
            type="button"
            [disabled]="!closeShift().enabled"
            (click)="closeShiftRequested.emit()"
          >
            {{ labels.PointCloseShift }}
          </button>
        }
      </div>
      @if (collection().reason === 'POINT_NOT_ACTIVE') {
        <p class="m-0 text-xs text-slate-500">{{ labels.PointCollectionNotActiveHint }}</p>
      }
    </section>
  `,
})
export class PointCashCardComponent {
  private readonly locale = inject(LOCALE_ID);

  protected readonly labels = Labels;

  readonly cash = input<Money | null>(null);
  readonly shift = input<RunningShift | null>(null);
  readonly shiftState = input.required<RunningShiftState>();
  readonly collection = input.required<ActionAvailability>();
  readonly closeShift = input.required<ActionAvailability>();

  readonly collect = output<void>();
  readonly closeShiftRequested = output<void>();

  protected readonly caption = computed(() => {
    const current = this.shift();
    if (!current) return '';
    return pointShiftCaption(
      current.sequence,
      formatDate(current.openedAt, OPENED_TIME_FORMAT, this.locale),
    );
  });
}
```

Note: the design names the output `closeShift`; an input and an output cannot share one class
member name, so the availability input keeps `closeShift` and the output is `closeShiftRequested`.
The tab (task-012) binds `(closeShiftRequested)`.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-cash-card.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
