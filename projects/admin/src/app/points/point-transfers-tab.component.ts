import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {
  ApiErrorParser,
  BusinessPeriod,
  ErrorMessageResolver,
  Labels,
  NotificationService,
  PointAdminStore,
  PointMoneyActionAvailability,
  PointMoneyRefreshFacade,
  PointMovementsStore,
  type PointPeriod,
  PointPositionsStore,
  PointResultsStore,
  type RunningShiftState,
  TimeStore,
} from '@bikerental/shared';
import { PointMoneyMoveLauncher } from './point-money-move.launcher';
import { POINT_MOVE_POSITIONS } from './point-money-move.meta';
import type { PointMoneyMoveResult } from './point-money-move.model';
import { PointMovementTableComponent } from './point-movement-table.component';
import { PointPeriodFilterComponent } from './point-period-filter.component';
import { PointResultsStripComponent } from './point-results-strip.component';

const PAGE_SIZE = 50;
const SHIFT_RULE_NOT_APPLIED: RunningShiftState = 'running';

@Component({
  selector: 'app-point-transfers-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [PointMovementsStore, PointResultsStore],
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatPaginatorModule,
    MatProgressBarModule,
    PointMovementTableComponent,
    PointPeriodFilterComponent,
    PointResultsStripComponent,
  ],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <div class="flex flex-wrap gap-2">
          <button
            mat-flat-button
            color="primary"
            type="button"
            [disabled]="!collection().enabled"
            (click)="onCollect()"
          >
            {{ labels.PointCollectCash }}
          </button>
          <button
            mat-flat-button
            type="button"
            class="btn-utility"
            [disabled]="!settlement().enabled"
            (click)="onSettle()"
          >
            {{ labels.PointRecordSettlement }}
          </button>
        </div>
        @if (collection().reason === 'POINT_NOT_ACTIVE') {
          <p class="m-0 text-xs text-slate-500">{{ labels.PointCollectionNotActiveHint }}</p>
        }
        @if (settlement().reason === 'POINT_PERMANENTLY_CLOSED') {
          <p class="m-0 text-xs text-slate-500">{{ labels.PointSettlementClosedHint }}</p>
        }
      </div>

      <div class="flex flex-wrap items-start gap-4">
        @if (movements.period(); as period) {
          <app-point-period-filter [period]="period" (periodChange)="onPeriodChange($event)" />
        }
        <mat-button-toggle-group
          [value]="movements.order()"
          [attr.aria-label]="labels.PointMovementOrderLabel"
          (change)="movements.setOrder($event.value)"
        >
          <mat-button-toggle value="newest">{{
            labels.PointMovementOrderNewest
          }}</mat-button-toggle>
          <mat-button-toggle value="oldest">{{
            labels.PointMovementOrderOldest
          }}</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <app-point-results-strip [results]="results.results()" />
      <p class="m-0 text-xs text-slate-500">{{ labels.PointMoveNote }}</p>

      @if (movements.loading() || results.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      @if (movements.failed()) {
        <p class="text-slate-400 text-center mt-8">{{ labels.PointMovementsLoadFailed }}</p>
      } @else {
        <app-point-movement-table
          [rows]="movements.rows()"
          [preset]="'history'"
          [emptyText]="labels.PointTransfersEmpty"
        />
        <mat-paginator
          [length]="movements.total()"
          [pageIndex]="movements.pageIndex()"
          [pageSize]="movements.pageSize()"
          [hidePageSize]="true"
          (page)="movements.loadPage($event.pageIndex)"
        />
      }
    </div>
  `,
})
export class PointTransfersTabComponent {
  protected readonly labels = Labels;
  protected readonly movements = inject(PointMovementsStore);
  protected readonly results = inject(PointResultsStore);

  private readonly positions = inject(PointPositionsStore);
  private readonly points = inject(PointAdminStore);
  private readonly facade = inject(PointMoneyRefreshFacade);
  private readonly time = inject(TimeStore);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);
  private readonly moves = inject(PointMoneyMoveLauncher);
  private readonly injector = inject(Injector);
  private seenRevision = this.facade.revision();

  protected readonly collection = computed(() =>
    PointMoneyActionAvailability.collection(
      this.points.selected()?.status ?? null,
      this.positions.cash(),
      SHIFT_RULE_NOT_APPLIED,
    ),
  );
  protected readonly settlement = computed(() =>
    PointMoneyActionAvailability.settlement(
      this.points.selected()?.status ?? null,
      this.positions.cardTerminal(),
    ),
  );

  constructor() {
    effect(() => {
      const slug = this.points.selectedSlug();
      if (!slug) return;
      untracked(() => {
        const period = BusinessPeriod.currentMonthToDate(this.time.getCurrentDate());
        this.movements.configure({
          pointSlug: slug,
          position: 'BANK',
          period,
          order: 'newest',
          pageSize: PAGE_SIZE,
        });
        this.results.configure(slug, period);
      });
    });
    effect(() => {
      const revision = this.facade.revision();
      if (revision === this.seenRevision) return;
      this.seenRevision = revision;
      untracked(() => {
        this.movements.reload();
        this.results.reload();
      });
    });
  }

  protected onPeriodChange(period: PointPeriod): void {
    this.movements.setPeriod(period);
    this.results.setPeriod(period);
  }

  protected onCollect(): void {
    const point = this.points.selected();
    const available = this.positions.cash();
    if (!point || !available) return;
    this.moves
      .open(this.injector, {
        operation: 'COLLECTION',
        pointSlug: point.slug,
        pointName: point.name,
        available,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onMoveClosed(result));
  }

  protected onSettle(): void {
    const point = this.points.selected();
    const available = this.positions.cardTerminal();
    if (!point || !available) return;
    this.moves
      .open(this.injector, {
        operation: 'SETTLEMENT',
        pointSlug: point.slug,
        pointName: point.name,
        available,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onMoveClosed(result));
  }

  private onMoveClosed(result: PointMoneyMoveResult | undefined): void {
    if (!result) return;
    if (result.outcome === 'done' && result.newPosition) {
      this.positions.applyPosition(POINT_MOVE_POSITIONS[result.operation], result.newPosition);
    }
    this.applyOutcome(result.outcome);
  }

  private applyOutcome(outcome: PointMoneyMoveResult['outcome']): void {
    this.facade.notifyChanged();
    const slug = this.points.selectedSlug();
    if (outcome !== 'statusChanged' || !slug) return;
    this.points
      .loadOne(slug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err: unknown) =>
          this.notifications.error(this.resolver.resolve(ApiErrorParser.parse(err))),
      });
  }
}
