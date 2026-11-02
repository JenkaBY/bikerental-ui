# Task 003: PointTransfersTabComponent (Collections tab)

> **Applied Skills:** `angular-component` - smart tab: standalone, `OnPush`, `inject()`, template under ~100 lines. `angular-signals` - `computed` availability, `effect` + `untracked` configuration (same shape as `PointOperationsTabComponent` / `PointCashTabComponent`). `angular-di` - tab-scoped `providers: [PointMovementsStore, PointResultsStore]`; `inject(Injector)` handed to `PointMoneyMoveLauncher`. `error-handling` - `ApiErrorParser` + `ErrorMessageResolver` + `NotificationService` (as in `applyOutcome` of the Cash tab). AGENTS.md - UI state (loading, paging, rows, totals) lives in the stores; no component signals for state; no comments.

## 1. Objective

Replace the empty shell `PointTransfersTabComponent` with the read-only history: header actions, one period filter driving both the list and the totals, order toggle, totals strip, adjustment note, history table, numbered paginator.

Decisions (do not change):

* **Route:** `projects/admin/src/app/points/point-detail.routes.ts` already has `path: 'transfers'` lazy-loading `PointTransfersTabComponent` from `./point-transfers-tab.component`. The route file is NOT touched.
* **Stores:** `PointMovementsStore` in its normal (non-accumulate) mode gives the numbered paginator (`total`, `pageIndex`, `pageSize`, `loadPage`). The existing `PointResultsStore` is reused for the totals (`results()` holds `PointPeriodResults`).
* **Table:** `PointMovementTableComponent` already has the `history` preset (`recordedAtBy`, `kind`, `magnitude`, no actions column). It is NOT modified.
* **No `RunningShiftStore` on this tab.** The collection cash amount is `PointPositionsStore.cash()` only (provided by `PointDetailPageComponent`); when positions are unavailable the amount is `null`, availability is `UNKNOWN` and the button is disabled. This avoids an extra shift request and error toast on a tab that has no shift UI.
* `PointMoneyActionAvailability.collection(...)` returns `HIDDEN` unless the shift state is `running`; this tab must show the button disabled with a hint instead, so the constant `SHIFT_RULE_NOT_APPLIED = 'running'` is passed to bypass the shift rule (the point-status and amount rules still apply).
* "Record settlement" keeps the interim info toast (`Labels.PointActionNotAvailableYet`) exactly like the Cash tab until blocked task 006.

Requires FR-03 (`PointMoneyActionAvailability`), FR-05 (`PointMoneyMoveLauncher`), task 001 and task 002.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-transfers-tab.component.ts`
* **Action:** Modify Existing File (replace the whole file)

## 3. Code Implementation

**Code to Add/Replace:** replace the entire file content with:

```typescript
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
            type="button"
            [disabled]="!collection().enabled"
            (click)="onCollect()"
          >
            {{ labels.PointCollectCash }}
          </button>
          <button
            mat-stroked-button
            type="button"
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
    this.notifications.info(Labels.PointActionNotAvailableYet);
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
```

Notes for the implementer:

* `PointPeriod`, `RunningShiftState`, `PointResultsStore`, `PointPositionsStore`, `PointMovementsStore` are all already exported from `@bikerental/shared`; do not add exports.
* If `ng lint` reports the file exceeds the size guideline, do NOT split it differently; report back instead.
* Do not add the `done`-toast: the launcher already shows "Collected: X".

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-transfers-tab.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
