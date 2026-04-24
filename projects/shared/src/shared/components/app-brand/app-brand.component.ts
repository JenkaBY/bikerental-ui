import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { APP_BRAND } from '../../../app.tokens';
import { Router } from '@angular/router';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="flex items-center gap-3 px-6 py-5 hover:cursor-pointer focus:outline-none"
      (click)="goHome()"
      aria-label="Navigate to home"
    >
      <mat-icon class="text-indigo-600 text-xl">directions_bike</mat-icon>
      <span class="text-lg font-semibold tracking-tight text-slate-800">{{ getBrand() }}</span>
    </button>
  `,
})
export class AppBrandComponent {
  brand = input<string>();
  protected appBrand = inject(APP_BRAND);
  private router = inject(Router);

  protected getBrand() {
    const b = this.brand();
    return typeof b === 'string' && b.length ? b : this.appBrand;
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
