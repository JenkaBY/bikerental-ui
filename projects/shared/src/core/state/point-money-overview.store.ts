import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import { PointFinanceService, PointLedgerUnavailableNotifier } from '../api/point-finance';
import type {
  Money,
  PointPeriod,
  PointPeriodResults,
  PointPositionKind,
  PointPositions,
  PointPositionsOverview,
} from '../models';

@Injectable()
export class PointMoneyOverviewStore {
  private readonly finance = inject(PointFinanceService);
  private readonly ledgerNotifier = inject(PointLedgerUnavailableNotifier);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _overview = signal<PointPositionsOverview | null>(null);
  private readonly _results = signal<PointPeriodResults | null>(null);
  private readonly _period = signal<PointPeriod | null>(null);
  private readonly _positionsLoading = signal(false);
  private readonly _resultsLoading = signal(false);
  private readonly _positionsFailed = signal(false);
  private readonly _resultsFailed = signal(false);

  private positionsSubscription: Subscription | null = null;
  private resultsSubscription: Subscription | null = null;

  readonly period = computed(() => this._period());
  readonly monthResults = computed(() => this._results());
  readonly positionsLoading = computed(() => this._positionsLoading());
  readonly resultsLoading = computed(() => this._resultsLoading());
  readonly positionsFailed = computed(() => this._positionsFailed());
  readonly resultsFailed = computed(() => this._resultsFailed());
  readonly positionsBySlug = computed(
    () =>
      new Map<string, PointPositions>(
        (this._overview()?.points ?? []).map((positions) => [positions.pointSlug, positions]),
      ),
  );
  readonly cashTotal = computed(() => this.totalOf('CASH'));
  readonly terminalTotal = computed(() => this.totalOf('CARD_TERMINAL'));

  load(period: PointPeriod): void {
    this._period.set(period);
    this.loadPositions();
    this.loadResults(period);
  }

  private loadPositions(): void {
    this.positionsSubscription?.unsubscribe();
    this._positionsLoading.set(true);
    this._positionsFailed.set(false);
    this.positionsSubscription = this.finance
      .getPositions()
      .pipe(
        finalize(() => this._positionsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (overview) => this._overview.set(overview),
        error: (err: unknown) => {
          this.ledgerNotifier.notify(err);
          this._overview.set(null);
          this._positionsFailed.set(true);
        },
      });
  }

  private loadResults(period: PointPeriod): void {
    this.resultsSubscription?.unsubscribe();
    this._resultsLoading.set(true);
    this._resultsFailed.set(false);
    this.resultsSubscription = this.finance
      .getResults(period)
      .pipe(
        finalize(() => this._resultsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (results) => this._results.set(results),
        error: (err: unknown) => {
          this.ledgerNotifier.notify(err);
          this._results.set(null);
          this._resultsFailed.set(true);
        },
      });
  }

  private totalOf(kind: PointPositionKind): Money | null {
    return this._overview()?.totals[kind] ?? null;
  }
}
