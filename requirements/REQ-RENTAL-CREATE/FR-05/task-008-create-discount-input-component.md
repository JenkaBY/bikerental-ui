# Task 008: Create `DiscountInputComponent` (Dumb)

> **Applied Skill:** `angular-component` — Dumb component. Optional 0–100 percent input. Emits `null` when cleared; emits the parsed number on valid blur/Enter.

## 1. Objective

Create a dumb numeric input for an optional discount percentage (0–100). Empty field emits `null`; a valid integer emits that number.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/discount-input.component.ts`
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
  selector: 'app-discount-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatFormFieldModule, MatInputModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ Labels.DiscountPercent }}</mat-label>
      <input
        matInput
        type="number"
        min="0"
        max="100"
        [ngModel]="rawValue()"
        (ngModelChange)="rawValue.set($event)"
        (blur)="commit()"
        (keydown.enter)="commit()"
      />
    </mat-form-field>
  `,
})
export class DiscountInputComponent {
  readonly value = input<number | null>(null);
  readonly valueChange = output<number | null>();

  protected readonly Labels = Labels;
  protected readonly rawValue = signal<number | string>('');

  constructor() {
    effect(() => {
      const v = this.value();
      this.rawValue.set(v !== null ? v : '');
    });
  }

  protected commit(): void {
    const raw = this.rawValue();
    if (raw === '' || raw === null) {
      this.valueChange.emit(null);
      return;
    }
    const parsed = Number(raw);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      this.valueChange.emit(parsed);
    } else {
      const current = this.value();
      this.rawValue.set(current !== null ? current : '');
    }
  }
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
