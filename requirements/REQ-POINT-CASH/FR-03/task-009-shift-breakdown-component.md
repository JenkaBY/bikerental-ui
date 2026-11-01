# Task 009: ShiftBreakdownComponent (shared, dumb)

> **Applied Skill:** `angular-component` - standalone, `OnPush`, `input()`, native control flow. AGENTS.md Shared Import Convention - relative paths inside `projects/shared`, never the `@bikerental/shared` barrel. i18n Rules - only `Labels.*` and `POINT_MOVEMENT_KIND_LABELS` (localized kind names from FR-02). No comments.

## 1. Objective

Create the reusable breakdown: "Shift opening", one line per movement kind present (backend order,
signed total, green for inflow / red for outflow), "Expected cash". `prominentExpected` enlarges the
expected line (operator screens). No arithmetic: values are rendered as delivered.

Requires task-001 and task-006.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/components/shift-breakdown/shift-breakdown.component.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** New file `projects/shared/src/shared/components/shift-breakdown/shift-breakdown.component.ts` - full content.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { RunningShift } from '../../../core/models';
import { Labels } from '../../constant/labels';
import { FixedMoneyPipe } from '../../pipes/fixed-money.pipe';
import { POINT_MOVEMENT_KIND_LABELS } from '../../point-money.meta';

@Component({
  selector: 'app-shift-breakdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FixedMoneyPipe],
  template: `
    <div class="flex flex-col gap-1 text-sm">
      <div class="flex justify-between gap-4">
        <span class="text-slate-600">{{ labels.PointShiftOpening }}</span>
        <span class="tabular-nums">{{ shift().openingAmount | fixedMoney }}</span>
      </div>
      @for (line of shift().kindTotals; track line.kind) {
        <div class="flex justify-between gap-4">
          <span class="text-slate-600">{{ kindLabels[line.kind] }}</span>
          <span
            class="tabular-nums"
            [class.text-emerald-600]="line.signedAmount.amount > 0"
            [class.text-red-700]="line.signedAmount.amount < 0"
          >
            {{ line.signedAmount | fixedMoney: true }}
          </span>
        </div>
      }
      <div
        class="flex justify-between gap-4 border-t border-slate-200 pt-1 font-semibold"
        [class.text-lg]="prominentExpected()"
      >
        <span>{{ labels.PointShiftExpectedCash }}</span>
        <span class="tabular-nums">{{ shift().expectedCash | fixedMoney }}</span>
      </div>
    </div>
  `,
})
export class ShiftBreakdownComponent {
  protected readonly labels = Labels;
  protected readonly kindLabels = POINT_MOVEMENT_KIND_LABELS;

  readonly shift = input.required<RunningShift>();
  readonly prominentExpected = input(false);
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below `export * from './shared/components/card-stack/card-stack.component';`
* **Snippet:**

```typescript
export * from './shared/components/shift-breakdown/shift-breakdown.component';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/components/shift-breakdown/shift-breakdown.component.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
