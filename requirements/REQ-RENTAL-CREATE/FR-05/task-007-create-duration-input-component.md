# Task 007: Create `DurationInputComponent` (Dumb)

> **Applied Skill:** `angular-component` — Dumb component rendering a numeric `mat-form-field`. Emits the raw parsed integer on blur or Enter; the parent smart component is responsible for snapping the value to the nearest snap point.

## 1. Objective

Create a dumb numeric input component showing the current duration value. On blur or Enter, it emits the raw integer. Invalid / empty input is silently reset to the current `value` input.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/duration-input.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-duration-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ Labels.DurationMinutes }}</mat-label>
      <input
        matInput
        type="number"
        [min]="min()"
        [max]="max()"
        [ngModel]="rawValue()"
        (ngModelChange)="rawValue.set($event)"
        (blur)="commit()"
        (keydown.enter)="commit()"
      />
    </mat-form-field>
  `,
})
export class DurationInputComponent {
  readonly value = input.required<number>();
  readonly min = input<number>(30);
  readonly max = input<number>(2880);
  readonly valueChange = output<number>();

  protected readonly Labels = Labels;
  protected readonly rawValue = signal<number | string>('');

  constructor() {
    effect(() => {
      this.rawValue.set(this.value());
    });
  }

  protected commit(): void {
    const parsed = Number(this.rawValue());
    if (!isNaN(parsed) && parsed > 0) {
      this.valueChange.emit(parsed);
    } else {
      this.rawValue.set(this.value());
    }
  }
}
```

> **Design note:** The emitted value is the raw typed integer. `RentalDurationControlComponent` (smart parent) applies snap-point rounding via `snapToNearest()` before writing to the store.

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
