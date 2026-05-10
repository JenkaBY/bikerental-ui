import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatSliderModule } from '@angular/material/slider';
import { findNearestIndex } from './snap-points';
import { normalizeToHuman } from '@bikerental/shared';

@Component({
  selector: 'app-duration-slider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSliderModule],
  template: `
    <mat-slider class="w-8/10!" [min]="0" [max]="sliderMax()" [step]="1" discrete showTickMarks>
      <input matSliderThumb [value]="sliderIndex()" (valueChange)="onSliderChange($event)" />
    </mat-slider>
    <span> {{ formatDuration(sliderIndex()) }}</span>
  `,
})
export class DurationSliderComponent {
  readonly value = input.required<number>();
  readonly snapPoints = input.required<readonly number[]>();
  readonly valueChange = output<number>();

  readonly sliderMax = computed(() => Math.max(0, this.snapPoints().length - 1));

  readonly sliderIndex = computed(() => findNearestIndex(this.value(), this.snapPoints()));

  onSliderChange(index: number): void {
    const snaps = this.snapPoints();
    if (index >= 0 && index < snaps.length) {
      this.valueChange.emit(snaps[index]);
    }
  }

  readonly formatDuration = (index: number): string => {
    return normalizeToHuman(this.snapPoints()[index]);
  };
}
