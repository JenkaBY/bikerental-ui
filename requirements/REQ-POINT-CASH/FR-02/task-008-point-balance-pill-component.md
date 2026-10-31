# Task 008: `PointBalancePillComponent` (dumb header pill: caption + amount)

> **Applied Skill:** `angular-component` - standalone, `ChangeDetectionStrategy.OnPush`, `input()` signal inputs only, no DI (dumb component). Styling follows the existing `CustomerBalancePillComponent` (`shrink-0 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap`, green for non-negative, red for negative). AGENTS.md - no raw strings (the caption is passed in as a `Labels.*` value); cross-project imports only from `@bikerental/shared`.

## 1. Objective

Create the pill used twice in the point detail header: "Cash 1 250.00" and "Terminal 830.50". `amount = null` (loading or failed snapshot) renders an em-dash in a neutral slate pill. Amounts use two decimals, the same format as the FR-01 points table.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/detail/point-balance-pill.component.ts`
* **Action:** Create New File (the folder `projects/admin/src/app/points/detail/` is new)

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/admin/src/app/points/detail/point-balance-pill.component.ts`
* **Snippet:**

```typescript
import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Money } from '@bikerental/shared';

@Component({
  selector: 'app-point-balance-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <span
      class="shrink-0 px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
      [class.bg-slate-100]="tone() === 'unknown'"
      [class.text-slate-600]="tone() === 'unknown'"
      [class.bg-green-100]="tone() === 'positive'"
      [class.text-green-800]="tone() === 'positive'"
      [class.bg-red-100]="tone() === 'negative'"
      [class.text-red-800]="tone() === 'negative'"
    >
      {{ label() }}
      <span class="tabular-nums">
        @if (amount(); as value) {
          {{ value.amount | number: '1.2-2' }}
        } @else {
          —
        }
      </span>
    </span>
  `,
})
export class PointBalancePillComponent {
  readonly label = input.required<string>();
  readonly amount = input<Money | null>(null);

  protected readonly tone = computed<'unknown' | 'positive' | 'negative'>(() => {
    const value = this.amount();
    if (!value) return 'unknown';
    return value.amount < 0 ? 'negative' : 'positive';
  });
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server. (The component is not routed yet; it is fully type-checked by the build once Task 012 imports it.)

```bash
npx prettier --write projects/admin/src/app/points/detail/point-balance-pill.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
