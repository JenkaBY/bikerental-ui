import { computed, inject, Injectable, signal } from '@angular/core';
import { PointPositionsStore } from './point-positions.store';

@Injectable()
export class PointMoneyRefreshFacade {
  private readonly positions = inject(PointPositionsStore);

  private readonly _revision = signal(0);

  readonly revision = computed(() => this._revision());

  notifyChanged(): void {
    this.positions.refresh();
    this._revision.update((revision) => revision + 1);
  }
}
