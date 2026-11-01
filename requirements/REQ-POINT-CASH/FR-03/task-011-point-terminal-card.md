# Task 011: PointTerminalCardComponent (admin, dumb)

> **Applied Skill:** `angular-component` - standalone, `OnPush`, `input()` / `output()`. AGENTS.md - `Labels` only, domain types only, no comments. Design FR-03 section 2.

## 1. Objective

Show the CARD_TERMINAL position and the "Record settlement" button. The button always renders
(settlement is never `HIDDEN`), is disabled per availability, and a disabled button with reason
`POINT_PERMANENTLY_CLOSED` shows the localized hint.

Requires tasks 001, 005, 006.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-terminal-card.component.ts` - **Action:** Create New File

## 3. Code Implementation

* **Location:** New file `projects/admin/src/app/points/point-terminal-card.component.ts` - full content.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { type ActionAvailability, FixedMoneyPipe, Labels, type Money } from '@bikerental/shared';

@Component({
  selector: 'app-point-terminal-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, FixedMoneyPipe],
  template: `
    <section class="rounded-xl border border-slate-200 bg-white p-4 flex flex-col gap-3">
      <h2 class="m-0 text-base font-semibold text-slate-700">
        {{ labels.PointTerminalCardTitle }}
      </h2>
      <div class="text-3xl font-semibold tabular-nums">{{ terminal() | fixedMoney }}</div>
      <div>
        <button
          mat-flat-button
          type="button"
          [disabled]="!settlement().enabled"
          (click)="settle.emit()"
        >
          {{ labels.PointRecordSettlement }}
        </button>
      </div>
      @if (settlement().reason === 'POINT_PERMANENTLY_CLOSED') {
        <p class="m-0 text-xs text-slate-500">{{ labels.PointSettlementClosedHint }}</p>
      }
    </section>
  `,
})
export class PointTerminalCardComponent {
  protected readonly labels = Labels;

  readonly terminal = input<Money | null>(null);
  readonly settlement = input.required<ActionAvailability>();

  readonly settle = output<void>();
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-terminal-card.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
