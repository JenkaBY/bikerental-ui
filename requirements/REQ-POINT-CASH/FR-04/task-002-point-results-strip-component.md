# Task 002: PointResultsStripComponent (period totals)

> **Applied Skill:** `angular-component` - dumb component: `input()` + `OnPush`, no injected state. `angular-signals` - `input<PointPeriodResults | null>()`. AGENTS.md Three-Layer pipeline - imports only the `core/models/` domain type via `@bikerental/shared`. Existing `PointResultsStore` is reused as the state holder (it already has `{ pointSlug, period, results, loading, failed }`, `configure`, `setPeriod`, `reload`, and calls `PointFinanceService.getResults(period, slug)`); NO new `PointPeriodResultsStore` is created.

## 1. Objective

Create a dumb strip showing "Cash collections X" and "Terminal settlements Y" for the period. While the totals are not loaded or failed (`results` is `null`) both values show an em-dash (`FixedMoneyPipe` renders `—` for `null`).

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-results-strip.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Code to Add/Replace:** create the file with exactly this content:

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FixedMoneyPipe, Labels, type PointPeriodResults } from '@bikerental/shared';

@Component({
  selector: 'app-point-results-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FixedMoneyPipe],
  template: `
    <div class="flex flex-wrap gap-8 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div class="flex flex-col">
        <span class="text-sm text-slate-500">{{ labels.PointResultCollections }}</span>
        <span class="text-xl font-semibold tabular-nums">
          {{ results()?.collected | fixedMoney }}
        </span>
      </div>
      <div class="flex flex-col">
        <span class="text-sm text-slate-500">{{ labels.PointResultTerminalSettlements }}</span>
        <span class="text-xl font-semibold tabular-nums">
          {{ results()?.terminalSettled | fixedMoney }}
        </span>
      </div>
    </div>
  `,
})
export class PointResultsStripComponent {
  protected readonly labels = Labels;

  readonly results = input<PointPeriodResults | null>(null);
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-results-strip.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
