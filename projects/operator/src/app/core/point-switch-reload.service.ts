import { inject, Injectable } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router } from '@angular/router';
import { DeployedPath } from '@bikerental/shared';

const RENTALS_ROUTE = 'rentals';
const NEW_RENTAL_SEGMENT = 'new';

@Injectable({ providedIn: 'root' })
export class PointSwitchReloadService {
  private readonly document = inject(DOCUMENT);
  private readonly router = inject(Router);

  reload(): void {
    if (this.isOnSingleRental()) {
      this.document.location.assign(
        DeployedPath.fromBase(this.document.baseURI).withRoute(RENTALS_ROUTE).toString(),
      );
      return;
    }
    this.document.location.reload();
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
