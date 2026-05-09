# Task 011: Create `RentalDurationControlComponent` (Smart)

> **Applied Skill:** `angular-component`, `angular-signals` — Smart component. Injects `RentalStore` (resolved from parent injector). Owns the `SNAP_POINTS` constant and `snapToNearest()` logic. Writes snapped value back to store. Keeps `DurationSliderComponent` and `DurationInputComponent` in sync via the store signal.

## 1. Objective

Create the smart component that composes the duration slider and the numeric input, keeping both in sync through the store signal. User changes from either control are snapped to the nearest snap point before being written to `RentalStore`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-duration-control.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Labels, RentalStore } from '@bikerental/shared';
import { DurationSliderComponent } from './duration-slider.component';
import { DurationInputComponent } from './duration-input.component';

const SNAP_POINTS = [30, 60, 120, 240, 480, 1440, 2880] as const;

function snapToNearest(value: number): number {
  return SNAP_POINTS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}

@Component({
  selector: 'app-rental-duration-control',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DurationSliderComponent, DurationInputComponent],
  template: `
    <div class="flex flex-col gap-3">
      <span class="text-sm font-medium text-slate-700">{{ Labels.Duration }}</span>
      <app-duration-slider
        [value]="store.durationMinutes()"
        [snapPoints]="snapPoints"
        (valueChange)="onDurationChange($event)"
      />
      <app-duration-input
        [value]="store.durationMinutes()"
        [min]="snapPoints[0]"
        [max]="snapPoints[snapPoints.length - 1]"
        (valueChange)="onDurationChange($event)"
      />
    </div>
  `,
})
export class RentalDurationControlComponent {
  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;
  protected readonly snapPoints = SNAP_POINTS;

  protected onDurationChange(raw: number): void {
    this.store.setDurationMinutes(snapToNearest(raw));
  }
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
