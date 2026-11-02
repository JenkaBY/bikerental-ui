import { computed, DestroyRef, inject, Injectable, LOCALE_ID, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { PointMoneyRow, PointMoneySummary } from '../models';
import { BusinessPeriod } from '../../shared/utils/business-period.util';
import { PointAdminStore } from './point-admin.store';
import { PointMoneyOverviewStore } from './point-money-overview.store';

@Injectable()
export class PointListViewStore {
  private readonly registry = inject(PointAdminStore);
  private readonly money = inject(PointMoneyOverviewStore);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _showClosed = signal(false);
  private readonly _registryFailed = signal(false);

  readonly showClosed = computed(() => this._showClosed());
  readonly registryFailed = computed(() => this._registryFailed());
  readonly loading = computed(() => this.registry.loading());

  readonly rows = computed<readonly PointMoneyRow[]>(() => {
    const positions = this.money.positionsBySlug();
    return this.registry.points().map((point) => {
      const entry = positions.get(point.slug);
      return {
        slug: point.slug,
        name: point.name,
        status: point.status,
        cash: entry?.amounts.CASH ?? null,
        terminal: entry?.amounts.CARD_TERMINAL ?? null,
        bank: entry?.amounts.BANK ?? null,
      };
    });
  });

  readonly visibleRows = computed<readonly PointMoneyRow[]>(() =>
    this._showClosed()
      ? this.rows()
      : this.rows().filter((row) => row.status !== 'PERMANENTLY_CLOSED'),
  );

  readonly hiddenClosedCount = computed(() => this.rows().length - this.visibleRows().length);

  readonly summary = computed<PointMoneySummary>(() => {
    const results = this.money.monthResults();
    const period = this.money.period();
    return {
      cash: this.money.cashTotal(),
      terminal: this.money.terminalTotal(),
      deposited: results?.total ?? null,
      collected: results?.collected ?? null,
      terminalSettled: results?.terminalSettled ?? null,
      monthName: period ? BusinessPeriod.monthName(period.to, this.locale) : '',
    };
  });

  load(now: Date): void {
    this._registryFailed.set(false);
    this.registry
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => this._registryFailed.set(true) });
    this.money.load(BusinessPeriod.currentMonthToDate(now));
  }

  setShowClosed(showClosed: boolean): void {
    this._showClosed.set(showClosed);
  }
}
