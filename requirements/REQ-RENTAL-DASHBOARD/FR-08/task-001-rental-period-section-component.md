# Task 001: Create `RentalPeriodSectionComponent`

> **Applied Skill:** `angular-component` — Smart presentational component. Reads signals
> directly from the injected `RentalStore`. No inputs, no outputs. Uses `DatePipe` (Angular
> core) and `DurationPipe` (shared library) for formatting.

## 1. Objective

Create a new component that renders the rental period row:
`{startDatetime} → {expectedReturnDatetime} · {paidDuration}`.
It reads `startedAt`, `expectedReturnAt`, `paidDurationMinutes`, and `isOverdue` directly
from `RentalStore`. The expected-return datetime receives the warning color when `isOverdue`
is `true`. Missing `expectedReturnAt` renders `—`. Duration formatting delegates to the
existing `DurationPipe` (no new pipe required).

**Depends on:** None.

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-period-section.component.ts`
* **Action:** Create New File

---

## 3. Code Implementation

### Full file content

```typescript
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DurationPipe, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-period-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DurationPipe],
  template: `
    <div class="px-4 py-3 flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-slate-700">
      <span>{{ store.startedAt() | date: 'dd.MM HH:mm' }}</span>
      <span class="text-slate-400">→</span>
      @if (store.expectedReturnAt(); as returnAt) {
        <span [class.text-amber-700]="store.isOverdue()">{{ returnAt | date: 'dd.MM HH:mm' }}</span>
      } @else {
        <span [class.text-amber-700]="store.isOverdue()">—</span>
      }
      <span class="text-slate-400">·</span>
      <span class="text-slate-500">{{ store.paidDurationMinutes() | duration }}</span>
    </div>
  `,
})
export class RentalPeriodSectionComponent {
  protected readonly store = inject(RentalStore);
}
```

---

**Key implementation notes:**

- `standalone: true` is **not** explicitly set — Angular v20+ components are standalone by
  default. Do NOT add `standalone: true`.
- `inject(RentalStore)` resolves from the parent component's providers hierarchy — `RentalStore`
  is provided in `RentalDetailComponent.providers`, so it is already in scope.
- `DatePipe` is imported from `@angular/common`, not from `@bikerental/shared`.
- `DurationPipe` is imported from `@bikerental/shared`; it delegates to `normalizeToHuman()`
  which already handles `undefined` (returns `"-- min"`) and formats `< 60 min` as `"Y min"`
  and `≥ 60 min` as `"X h Y min"`.
- `'dd.MM HH:mm'` format produces strings like `"14.05 10:00"`, short enough for a 360 dp
  wide screen.
- `[class.text-amber-700]` is applied to **both** the populated and the empty (`—`) span for
  `expectedReturnAt` to ensure the warning color is visible in the missing-time scenario too.
- No inputs, no outputs — all reactive data comes directly from the store.

---

## 4. Validation Steps

skip