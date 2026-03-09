import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { APP_BRAND } from '../../../app.tokens';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 px-6 py-5">
      <mat-icon class="text-indigo-600 text-xl">directions_bike</mat-icon>
      <span class="text-lg font-semibold tracking-tight text-slate-800">{{ getBrand() }}</span>
    </div>
  `,
})
export class AppBrandComponent {
  brand = input<string | undefined>(undefined);
  protected appBrand = inject(APP_BRAND);

  // When rendering, prefer explicit input if provided, otherwise app token
  protected getBrand = () => {
    const b = this.brand();
    return typeof b === 'string' && b.length ? b : this.appBrand;
  };
}
