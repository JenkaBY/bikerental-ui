import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { PointFinanceService, PointLedgerUnavailableNotifier } from '../api/point-finance';
import type { Money, PointPeriod, PointPeriodResults } from '../models';
import { Labels } from '../../shared/constant/labels';
import { pointResultTransferCount } from '../../shared/constant/point-money-messages';
import { PointPeriodRule } from '../../shared/utils/point-period.rule';

export interface PointResultFigure {
  readonly id: string;
  readonly label: string;
  readonly amount: Money;
  readonly hint: string | null;
  readonly emphasis: boolean;
}

interface PointResultsState {
  readonly pointSlug: string | null;
  readonly period: PointPeriod | null;
  readonly results: PointPeriodResults | null;
  readonly loading: boolean;
  readonly failed: boolean;
}

const INITIAL_STATE: PointResultsState = {
  pointSlug: null,
  period: null,
  results: null,
  loading: false,
  failed: false,
};

@Injectable()
export class PointResultsStore {
  private readonly finance = inject(PointFinanceService);
  private readonly ledgerNotifier = inject(PointLedgerUnavailableNotifier);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _state = signal<PointResultsState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly period = computed(() => this._state().period);
  readonly results = computed(() => this._state().results);
  readonly loading = computed(() => this._state().loading);
  readonly failed = computed(() => this._state().failed);
  readonly figures = computed<readonly PointResultFigure[]>(() => {
    const r = this._state().results;
    if (!r) return [];
    const count = (n: number | null) => (n === null ? null : pointResultTransferCount(n));
    return [
      {
        id: 'revenue',
        label: Labels.PointResultRevenue,
        amount: r.revenue,
        hint: null,
        emphasis: false,
      },
      {
        id: 'corrections',
        label: Labels.PointResultCorrections,
        amount: r.corrections,
        hint: null,
        emphasis: false,
      },
      {
        id: 'result',
        label: Labels.PointResultTotal,
        amount: r.result,
        hint: Labels.PointResultTotalHint,
        emphasis: true,
      },
      {
        id: 'collections',
        label: Labels.PointResultCollections,
        amount: r.collected,
        hint: count(r.collectedCount),
        emphasis: false,
      },
      {
        id: 'settlements',
        label: Labels.PointResultTerminalSettlements,
        amount: r.terminalSettled,
        hint: count(r.terminalSettledCount),
        emphasis: false,
      },
    ];
  });

  configure(pointSlug: string, period: PointPeriod): void {
    this.update({ pointSlug, period, results: null });
    this.fetch();
  }

  setPeriod(period: PointPeriod): void {
    this.update({ period });
    this.fetch();
  }

  reload(): void {
    this.fetch();
  }

  private fetch(): void {
    const { pointSlug, period } = this._state();
    if (!pointSlug || !period || PointPeriodRule.validate(period.from, period.to) !== null) return;
    this.subscription?.unsubscribe();
    this.update({ loading: true, failed: false });
    this.subscription = this.finance
      .getResults(period, pointSlug)
      .pipe(
        finalize(() => this.update({ loading: false })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (results) => this.update({ results }),
        error: (err: unknown) => {
          this.ledgerNotifier.notify(err);
          this.update({ results: null, failed: true });
        },
      });
  }

  private update(patch: Partial<PointResultsState>): void {
    this._state.update((state) => ({ ...state, ...patch }));
  }
}
