# Task 006: Create `DurationSliderComponent` (Dumb)

> **Applied Skill:** `angular-component` — Dumb component wrapping `mat-slider`. Uses `input()` / `output()`. No store injection. Maps between snap-point values (minutes) and the slider's 0-based index internally.

## 1. Objective

Create a dumb slider component that renders a `mat-slider` with discrete snapping. It receives the current `value` in minutes and a `snapPoints` array, maps them to a 0-based index for the slider, and emits the selected snap-point value via `valueChange`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/duration-slider.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-duration-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSliderModule],
  template: `
    <mat-slider
      class="w-full"
      [min]="0"
      [max]="sliderMax()"
      [step]="1"
      discrete
    >
      <input
        matSliderThumb
        [value]="sliderIndex()"
        (valueChange)="onSliderChange($event)"
      />
    </mat-slider>
  `,
})
export class DurationSliderComponent {
  readonly value = input.required<number>();
  readonly snapPoints = input.required<readonly number[]>();
  readonly valueChange = output<number>();

  protected readonly sliderMax = computed(() => Math.max(0, this.snapPoints().length - 1));

  protected readonly sliderIndex = computed(() => {
    const snaps = this.snapPoints();
    if (snaps.length === 0) return 0;
    return snaps.reduce(
      (bestIdx, curr, i) =>
        Math.abs(curr - this.value()) < Math.abs(snaps[bestIdx] - this.value()) ? i : bestIdx,
      0,
    );
  });

  protected onSliderChange(index: number): void {
    const snaps = this.snapPoints();
    if (index >= 0 && index < snaps.length) {
      this.valueChange.emit(snaps[index]);
    }
  }
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
