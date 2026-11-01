import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FinanceReceiptStore } from '@bikerental/shared';

const RENTALS_ROUTE = 'rentals';
const NEW_RENTAL_SEGMENT = 'new';
const CASH_ROUTE = 'cash';

@Injectable({ providedIn: 'root' })
export class PointSwitchRefreshService {
  private readonly router = inject(Router);
  private readonly receipts = inject(FinanceReceiptStore);
  private readonly _epoch = signal(0);

  readonly epoch = computed(() => this._epoch());

  refresh(): void {
    if (this.isOnSingleRental()) {
      void this.router.navigateByUrl(`/${RENTALS_ROUTE}`);
      return;
    }
    if (this.isOnCashSubRoute()) {
      this.receipts.clear();
      void this.router.navigateByUrl(`/${CASH_ROUTE}`, { replaceUrl: true });
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

  private isOnCashSubRoute(): boolean {
    const segments = this.router.parseUrl(this.router.url).root.children['primary']?.segments ?? [];
    return segments.length >= 2 && segments[0].path === CASH_ROUTE;
  }
}
