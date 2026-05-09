import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Labels, RentalStore } from '@bikerental/shared';
import { DurationSliderComponent } from './duration-slider.component';
import { DurationInputComponent } from './duration-input.component';
import { DURATION_SNAP_POINTS_TOKEN, SNAP_TO_NEAREST_TOKEN } from '../duration-snap-point.provider';

@Component({
  selector: 'app-rental-duration-control',
  standalone: true,
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
  protected readonly snapPoints = inject(DURATION_SNAP_POINTS_TOKEN);
  private readonly snapFn = inject(SNAP_TO_NEAREST_TOKEN);

  protected onDurationChange(raw: number): void {
    this.store.setDurationMinutes(this.snapFn(raw));
  }
}
