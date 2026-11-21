import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { APP_BRAND } from '../../../app.tokens';
import { Router } from '@angular/router';
import { Labels } from '../../constant/labels';
import { UserStore } from '../../../core/state/user.store';

@Component({
  selector: 'app-brand',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="flex items-center gap-3 px-6 h-16 shrink-0 hover:cursor-pointer focus:outline-none"
      (click)="goHome()"
      [attr.aria-label]="Labels.NavigateToHomeAria"
    >
      <mat-icon class="text-indigo-600 text-xl">directions_bike</mat-icon>
      <span class="flex flex-col items-start min-w-0">
        <span class="text-lg font-semibold tracking-tight text-slate-800 leading-tight">{{
          getBrand()
        }}</span>
        @if (clientName(); as client) {
          <span
            class="text-xs text-slate-500 truncate max-w-[10rem] leading-tight"
            [attr.aria-label]="Labels.AccountClient"
            [title]="client"
            >{{ client }}</span
          >
        }
      </span>
    </button>
  `,
})
export class AppBrandComponent {
  protected readonly Labels = Labels;
  brand = input<string>();
  protected appBrand = inject(APP_BRAND);
  private router = inject(Router);
  private readonly userStore = inject(UserStore);
  protected readonly clientName = computed(
    () => this.userStore.currentUser()?.client?.displayName ?? null,
  );

  protected getBrand() {
    const b = this.brand();
    return typeof b === 'string' && b.length ? b : this.appBrand;
  }

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
