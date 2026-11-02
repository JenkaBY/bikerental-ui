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
  PointPositionsStore,
  RunningShiftStore,
  TimeStore,
} from '@bikerental/shared';
import { PointCashCardComponent } from './point-cash-card.component';
import { PointMovementTableComponent } from './point-movement-table.component';
import { PointTerminalCardComponent } from './point-terminal-card.component';
import { PointMoneyMoveLauncher } from './point-money-move.launcher';
import { POINT_MOVE_POSITIONS } from './point-money-move.meta';
import type { PointMoneyMoveResult } from './point-money-move.model';
import { ShiftClosureLauncher } from './shift-closure.launcher';

const PAGE_SIZE = 100;

type MoneyDialogOutcome = 'done' | 'statusChanged' | 'shiftChanged';

@Component({
  selector: 'app-point-cash-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RunningShiftStore, PointMovementsStore],
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    PointCashCardComponent,
    PointTerminalCardComponent,
    PointMovementTableComponent,
  ],
  template: `
    <div class="p-4 md:p-6 flex flex-col gap-4">
      <div class="grid gap-4 md:grid-cols-2">
        <app-point-cash-card
          [cash]="positions.cash()"
          [shift]="shiftStore.shift()"
          [shiftState]="shiftStore.state()"
          [collection]="collection()"
          [closeShift]="closeShift()"
          (collect)="onCollect()"
          (closeShiftRequested)="onCloseShift()"
        />
        <app-point-terminal-card
          [terminal]="positions.cardTerminal()"
          [settlement]="settlement()"
          (settle)="onSettle()"
        />
      </div>

      @if (shiftStore.state() === 'running') {
        <section class="flex flex-col gap-2">
          <h2 class="m-0 text-base font-semibold text-slate-700">
            {{ labels.PointShiftMovementsTitle }}
          </h2>
          @if (movements.loading()) {
            <mat-progress-bar mode="indeterminate" />
          }
          @if (movements.failed()) {
            <p class="text-slate-400 text-center mt-8">{{ labels.PointMovementsLoadFailed }}</p>
          } @else {
            <app-point-movement-table
              [rows]="movements.rows()"
              [preset]="'shift'"
              [emptyText]="labels.PointShiftMovementsEmpty"
            />
            @if (movements.hasMore()) {
              <div class="flex justify-center">
                <button
                  mat-stroked-button
                  type="button"
                  [disabled]="movements.loading()"
                  (click)="movements.loadMore()"
                >
                  {{ labels.ShowMore }}
                </button>
              </div>
            }
          }
        </section>
      }
    </div>
  `,
})
export class PointCashTabComponent {
  protected readonly labels = Labels;
  protected readonly shiftStore = inject(RunningShiftStore);
  protected readonly movements = inject(PointMovementsStore);
  protected readonly positions = inject(PointPositionsStore);

  private readonly points = inject(PointAdminStore);
  private readonly facade = inject(PointMoneyRefreshFacade);
  private readonly time = inject(TimeStore);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);
  private readonly moves = inject(PointMoneyMoveLauncher);
  private readonly closures = inject(ShiftClosureLauncher);
  private readonly injector = inject(Injector);
  private seenRevision = this.facade.revision();

  protected readonly cashAmount = computed(
    () => this.positions.cash() ?? this.shiftStore.shift()?.expectedCash ?? null,
  );
  protected readonly collection = computed(() =>
    PointMoneyActionAvailability.collection(
      this.points.selected()?.status ?? null,
      this.cashAmount(),
      this.shiftStore.state(),
    ),
  );
  protected readonly settlement = computed(() =>
    PointMoneyActionAvailability.settlement(
      this.points.selected()?.status ?? null,
      this.positions.cardTerminal(),
    ),
  );
  protected readonly closeShift = computed(() =>
    PointMoneyActionAvailability.closeShift(this.shiftStore.state()),
  );

  constructor() {
    effect(() => {
      const slug = this.points.selectedSlug();
      if (!slug) return;
      untracked(() => this.shiftStore.load(slug));
    });
    effect(() => {
      if (!this.shiftStore.shiftId()) return;
      untracked(() => this.configureMovements());
    });
    effect(() => {
      const revision = this.facade.revision();
      if (revision === this.seenRevision) return;
      this.seenRevision = revision;
      untracked(() => {
        this.shiftStore.refresh();
        this.movements.reload();
      });
    });
  }

  protected onCollect(): void {
    const point = this.points.selected();
    const available = this.cashAmount();
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

  private onMoveClosed(result: PointMoneyMoveResult | undefined): void {
    if (!result) return;
    if (result.outcome === 'done' && result.newPosition) {
      this.positions.applyPosition(POINT_MOVE_POSITIONS[result.operation], result.newPosition);
    }
    this.applyOutcome(result.outcome);
  }

  protected onCloseShift(): void {
    const point = this.points.selected();
    const shift = this.shiftStore.shift();
    if (!point || !shift) return;
    this.closures
      .open({ pointSlug: point.slug, pointName: point.name, shift })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.applyOutcome(result?.outcome));
  }

  protected onSettle(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }

  protected applyOutcome(outcome: MoneyDialogOutcome | undefined): void {
    if (!outcome) return;
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

  private configureMovements(): void {
    const slug = this.points.selectedSlug();
    const shift = this.shiftStore.shift();
    if (!slug || !shift) return;
    this.movements.configure({
      pointSlug: slug,
      position: 'CASH',
      period: BusinessPeriod.sinceDayOf(shift.openedAt, this.time.getCurrentDate()),
      order: 'newest',
      pageSize: PAGE_SIZE,
      notBefore: shift.openedAt,
      accumulate: true,
    });
  }
}
