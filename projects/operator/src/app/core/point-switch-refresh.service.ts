import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';

const RENTALS_ROUTE = 'rentals';
const NEW_RENTAL_SEGMENT = 'new';

@Injectable({ providedIn: 'root' })
export class PointSwitchRefreshService {
  private readonly router = inject(Router);
  private readonly _epoch = signal(0);

  readonly epoch = computed(() => this._epoch());

  refresh(): void {
    if (this.isOnSingleRental()) {
      void this.router.navigateByUrl(`/${RENTALS_ROUTE}`);
      return;
    }
    this._epoch.update((epoch) => epoch + 1);
  }

  private isOnSingleRental(): boolean {
    const segments = this.router.parseUrl(this.router.url).root.children['primary']?.segments ?? [];
    return (
      segments.length >= 2 &&
      segments[0].path === RENTALS_ROUTE &&
      segments[1].path !== NEW_RENTAL_SEGMENT
    );
  }
}
