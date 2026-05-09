import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';

@Component({
  selector: 'app-duration-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSliderModule],
  template: `
    <mat-slider class="w-full" [min]="0" [max]="sliderMax()" [step]="1" discrete>
      <input matSliderThumb [value]="sliderIndex()" (valueChange)="onSliderChange($event)" />
    </mat-slider>
  `,
})
export class DurationSliderComponent {
  readonly value = input.required<number>();
  readonly snapPoints = input.required<readonly number[]>();
  readonly valueChange = output<number>();

  readonly sliderMax = computed(() => Math.max(0, this.snapPoints().length - 1));

  readonly sliderIndex = computed(() => {
    const snaps = this.snapPoints();
    if (snaps.length === 0) return 0;
    return snaps.reduce(
      (bestIdx, curr, i) =>
        Math.abs(curr - this.value()) < Math.abs(snaps[bestIdx] - this.value()) ? i : bestIdx,
      0,
    );
  });

  onSliderChange(index: number): void {
    const snaps = this.snapPoints();
    if (index >= 0 && index < snaps.length) {
      this.valueChange.emit(snaps[index]);
    }
  }
}
