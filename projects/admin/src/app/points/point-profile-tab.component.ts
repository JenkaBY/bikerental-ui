import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PointAdminStore } from '@bikerental/shared';
import { PointProfileFormComponent } from './point-profile-form.component';
import { PointStatusActionsComponent } from './point-status-actions.component';

@Component({
  selector: 'app-point-profile-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PointProfileFormComponent, PointStatusActionsComponent],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-4">
      @if (points.selected(); as point) {
        <div class="flex justify-end">
          <app-point-status-actions [point]="point" />
        </div>
        <app-point-profile-form [mode]="'edit'" [point]="point" />
      }
    </div>
  `,
})
export class PointProfileTabComponent {
  protected readonly points = inject(PointAdminStore);
}
