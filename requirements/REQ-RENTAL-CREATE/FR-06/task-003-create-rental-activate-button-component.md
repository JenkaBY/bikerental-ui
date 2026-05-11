# Task 003: Create `RentalActivateButtonComponent`

> **Applied Skill:** `angular-component` — Dumb component. Full-width primary action button with loading state. Receives `disabled` and `loading` as `input()` signals; emits `activateRequested` via `output()`. No store injection.

## 1. Objective

Create a reusable "Start Rental" button that shows a spinner while an in-flight request is active and prevents double-submission via the `disabled` and `loading` inputs.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-activate-button.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels } from '@bikerental/shared';

@Component({
  selector: 'app-rental-activate-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  template: `
    <button
      mat-flat-button
      class="w-full"
      style="min-height: 48px"
      [disabled]="disabled() || loading()"
      (click)="activateRequested.emit()"
    >
      @if (loading()) {
        <mat-spinner diameter="20" />
      } @else {
        {{ Labels.StartRental }}
      }
    </button>
  `,
})
export class RentalActivateButtonComponent {
  protected readonly Labels = Labels;

  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);

  readonly activateRequested = output<void>();
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
