import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 px-6 py-5">
      <mat-icon class="text-indigo-600 text-xl">directions_bike</mat-icon>
      <span class="text-lg font-semibold tracking-tight text-slate-800">{{ brand() }}</span>
    </div>
  `,
})
export class AppBrandComponent {
  brand = input.required<string>();
}
