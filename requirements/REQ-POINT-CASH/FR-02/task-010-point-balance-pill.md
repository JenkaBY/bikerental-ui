# Task 010: PointBalancePillComponent (header "Cash X" / "Terminal Y" pill)

> **Applied Skill:** `angular-component` - dumb, `OnPush`, `input()` only. Customer header pill styling (`customer-detail.component.ts`: `px-2 py-0.5 rounded-full bg-green-100 text-green-800 whitespace-nowrap`). FR-02 NFR - unknown positions show an em-dash (`FixedMoneyPipe` prints `—` for `null`).

## 1. Objective

Create the small pill used twice in the point detail header.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-balance-pill.component.ts`
* **Action:** Create New File

## 3. Code Implementation

* **Location:** New file - full content.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FixedMoneyPipe, type Money } from '@bikerental/shared';

@Component({
  selector: 'app-point-balance-pill',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FixedMoneyPipe],
  template: `
    <span
      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 whitespace-nowrap"
    >
      <span>{{ label() }}</span>
      <span class="font-semibold tabular-nums">{{ amount() | fixedMoney }}</span>
    </span>
  `,
})
export class PointBalancePillComponent {
  readonly label = input.required<string>();
  readonly amount = input<Money | null>(null);
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-balance-pill.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
