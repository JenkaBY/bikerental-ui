import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Labels, RentalStore } from '@bikerental/shared';
import { DurationSliderComponent } from './duration-slider.component';
import { DURATION_SNAP_POINTS, snapToNearest } from './snap-points';

@Component({
  selector: 'app-rental-duration-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DurationSliderComponent],
  template: `
    <div class="flex flex-col gap-3">
      <span class="text-sm font-medium text-slate-700">{{ Labels.Duration }}</span>
      <app-duration-slider
        [value]="store.durationMinutes()"
        [snapPoints]="snapPoints()"
        (valueChange)="onDurationChange($event)"
      />
    </div>
  `,
})
export class RentalDurationControlComponent {
  protected readonly store = inject(RentalStore);
  protected readonly snapPoints = signal(DURATION_SNAP_POINTS).asReadonly();
  protected readonly Labels = Labels;

  protected onDurationChange(raw: number): void {
    this.store.setDurationMinutes(snapToNearest(raw));
  }
}
