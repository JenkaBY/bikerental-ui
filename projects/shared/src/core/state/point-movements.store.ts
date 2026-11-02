import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { PointFinanceService, PointLedgerUnavailableNotifier } from '../api/point-finance';
import { POINT_MOVEMENTS_MAX_PAGE_SIZE } from '../models';
import type {
  PointMovement,
  PointMovementFilterKind,
  PointMovementOrder,
  PointMovementPosition,
  PointMovementRow,
  PointPeriod,
} from '../models';
import { PointPeriodRule } from '../../shared/utils/point-period.rule';
import { CustomerNameResolver } from './customer-name.resolver';
import { StaffNameResolver } from './staff-name.resolver';

export interface PointMovementsConfig {
  readonly pointSlug: string;
  readonly position: PointMovementPosition;
  readonly period: PointPeriod;
  readonly order: PointMovementOrder;
  readonly kinds?: readonly PointMovementFilterKind[];
  readonly pageSize: number;
  readonly notBefore?: Date | null;
  readonly accumulate?: boolean;
}

@Injectable()
export class PointMovementsStore {
  private readonly finance = inject(PointFinanceService);
  private readonly ledgerNotifier = inject(PointLedgerUnavailableNotifier);
  private readonly names = inject(StaffNameResolver);
  private readonly customerNames = inject(CustomerNameResolver);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _config = signal<PointMovementsConfig | null>(null);
  private readonly _pageIndex = signal(0);
  private readonly _items = signal<readonly PointMovement[]>([]);
  private readonly _total = signal(0);
  private readonly _loading = signal(false);
  private readonly _failed = signal(false);

  private subscription: Subscription | null = null;

  readonly position = computed<PointMovementPosition>(() => this._config()?.position ?? 'CASH');
  readonly period = computed(() => this._config()?.period ?? null);
  readonly order = computed<PointMovementOrder>(() => this._config()?.order ?? 'newest');
  readonly kinds = computed<readonly PointMovementFilterKind[]>(() => this._config()?.kinds ?? []);
  readonly pageIndex = computed(() => this._pageIndex());
  readonly pageSize = computed(() => this._config()?.pageSize ?? POINT_MOVEMENTS_MAX_PAGE_SIZE);
  readonly total = computed(() => this._total());
  readonly loading = computed(() => this._loading());
  readonly failed = computed(() => this._failed());
  readonly hasMore = computed(() => {
    const config = this._config();
    if (!config?.accumulate || this._failed()) return false;
    if (this._items().length >= this._total()) return false;
    const notBefore = config.notBefore ?? null;
    if (!notBefore || config.order !== 'newest') return true;
    return !this._items().some((movement) => movement.recordedAt.getTime() < notBefore.getTime());
  });
  readonly rows = computed<readonly PointMovementRow[]>(() => {
    const notBefore = this._config()?.notBefore ?? null;
    return this._items()
      .filter((movement) => !notBefore || movement.recordedAt.getTime() >= notBefore.getTime())
      .map((movement) => ({
        ...movement,
        recordedByName: this.names.nameFor(movement.recordedById),
        customerName: this.customerNames.nameFor(movement.customerId),
      }));
  });

  configure(config: PointMovementsConfig): void {
    this._config.set({
      ...config,
      pageSize: Math.min(config.pageSize, POINT_MOVEMENTS_MAX_PAGE_SIZE),
    });
    this.names.ensureLoaded();
    this.fetch(0);
  }

  setPosition(position: PointMovementPosition): void {
    this.patch({ position });
  }

  setPeriod(period: PointPeriod): void {
    this.patch({ period });
  }

  setOrder(order: PointMovementOrder): void {
    this.patch({ order });
  }

  setKinds(kinds: readonly PointMovementFilterKind[]): void {
    this.patch({ kinds });
  }

  loadPage(pageIndex: number): void {
    this.fetch(pageIndex);
  }

  loadMore(): void {
    if (this.hasMore() && !this._loading()) this.fetch(this._pageIndex() + 1, true);
  }

  reload(): void {
    this.fetch(this._config()?.accumulate ? 0 : this._pageIndex());
  }

  private patch(change: Partial<PointMovementsConfig>): void {
    const config = this._config();
    if (!config) return;
    this._config.set({ ...config, ...change });
    this.fetch(0);
  }

  private fetch(pageIndex: number, append = false): void {
    const config = this._config();
    if (!config || PointPeriodRule.validate(config.period.from, config.period.to) !== null) return;
    this.subscription?.unsubscribe();
    const previousPageIndex = this._pageIndex();
    this._pageIndex.set(pageIndex);
    this._loading.set(true);
    this._failed.set(false);
    this.subscription = this.finance
      .getMovements({
        pointSlug: config.pointSlug,
        position: config.position,
        period: config.period,
        order: config.order,
        kinds: config.kinds ?? [],
        page: pageIndex,
        size: config.pageSize,
      })
      .pipe(
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (page) => {
          this._items.set(append ? [...this._items(), ...page.items] : page.items);
          this._total.set(page.totalItems);
          this.customerNames.ensureLoaded(page.items.map((item) => item.customerId));
        },
        error: (err: unknown) => {
          this.ledgerNotifier.notify(err);
          if (append) {
            this._pageIndex.set(previousPageIndex);
            return;
          }
          this._items.set([]);
          this._total.set(0);
          this._failed.set(true);
        },
      });
  }
}
