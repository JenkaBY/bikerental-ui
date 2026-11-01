import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  LOCALE_ID,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import {
  type ApiError,
  type CashCollection,
  CurrentPointStore,
  ErrorMessageResolver,
  type FinanceConfirmData,
  FinanceConfirmDialogComponent,
  type FinanceConfirmResult,
  FinanceReceiptStore,
  formatFixedMoney,
  Labels,
  makeMoney,
  NotificationService,
  OperatingScopeStore,
  operatorHandInAmount,
  PageHeaderComponent,
  PointMoneyErrorClassifier,
  pointMoveRemaining,
  RunningShiftStore,
} from '@bikerental/shared';
import { buildCollectionConfirm } from './operator-collection-confirm';
import { OperatorCollectionFormComponent } from './operator-collection-form.component';
import { OperatorCollectionStore } from './operator-collection.store';

@Component({
  selector: 'app-operator-cash-collection',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RunningShiftStore, OperatorCollectionStore],
  imports: [
    MatButtonModule,
    MatProgressBarModule,
    PageHeaderComponent,
    OperatorCollectionFormComponent,
  ],
  template: `
    <div class="flex flex-col gap-4">
      <app-page-header
        class="block -mx-4 -mt-4"
        [title]="labels.OperatorHandInCash"
        [backLabel]="labels.Back"
        (back)="leave()"
      />
      @switch (shiftStore.state()) {
        @case ('loading') {
          <mat-progress-bar mode="indeterminate" />
        }
        @case ('failed') {
          <div class="flex flex-col items-center gap-4 py-12 text-center">
            <p class="m-0 text-slate-400">{{ labels.PointShiftLoadFailed }}</p>
            <button mat-stroked-button type="button" class="!h-12" (click)="onRetry()">
              {{ labels.Retry }}
            </button>
          </div>
        }
        @case ('running') {
          @if (collection.ready()) {
            <app-operator-collection-form
              [available]="collection.available()"
              [remainingText]="remainingText()"
              [submitLabel]="submitLabel()"
              [serverError]="collection.amountError()"
              [busy]="collection.submitting()"
              (amountChange)="collection.setAmount($event)"
              (submitted)="onSubmit($event)"
            />
          }
        }
      }
    </div>
  `,
})
export class OperatorCashCollectionComponent {
  protected readonly labels = Labels;
  protected readonly shiftStore = inject(RunningShiftStore);
  protected readonly collection = inject(OperatorCollectionStore);

  private readonly points = inject(CurrentPointStore);
  private readonly scope = inject(OperatingScopeStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly receipts = inject(FinanceReceiptStore);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly form = viewChild(OperatorCollectionFormComponent);
  private left = false;
  private readonly refreshed = signal(false);

  protected readonly remainingText = computed(() =>
    pointMoveRemaining(formatFixedMoney(this.collection.remaining(), this.locale)),
  );
  protected readonly submitLabel = computed(() => {
    const handIn = this.collection.handIn();
    return handIn
      ? operatorHandInAmount(formatFixedMoney(handIn, this.locale))
      : Labels.OperatorHandInCash;
  });

  constructor() {
    if (!this.scope.notEstablished() && this.points.currentSlug() !== null) {
      this.shiftStore.load(null);
      this.points
        .refreshCurrent()
        .pipe(
          finalize(() => this.refreshed.set(true)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe();
    }
    effect(() => {
      const noPoint = this.scope.notEstablished() || this.points.currentSlug() === null;
      const state = this.shiftStore.state();
      const shift = this.shiftStore.shift();
      const status = this.points.current()?.status ?? null;
      const refreshed = this.refreshed();
      untracked(() => {
        if (this.left) return;
        if (noPoint) {
          this.leave();
        } else if (state === 'none') {
          this.notifications.info(Labels.PointShiftNone);
          this.leave();
        } else if (state === 'running' && shift) {
          if (status === null && !refreshed) return;
          if (status !== 'ACTIVE') {
            this.notifications.error(Labels.PointCollectionNotActiveHint);
            this.leave();
          } else if (!this.collection.ready()) {
            this.collection.init(shift.expectedCash);
          }
        }
      });
    });
  }

  protected leave(): void {
    if (this.left) return;
    this.left = true;
    void this.router.navigate(['/cash'], { replaceUrl: true });
  }

  protected onRetry(): void {
    this.shiftStore.load(null);
  }

  protected onSubmit(amount: number): void {
    const pointName = this.points.current()?.name ?? '';
    const money = makeMoney(amount, this.collection.available().currency);
    this.dialog
      .open<
        FinanceConfirmDialogComponent,
        FinanceConfirmData<CashCollection>,
        FinanceConfirmResult<CashCollection>
      >(FinanceConfirmDialogComponent, {
        data: buildCollectionConfirm(
          { pointName, amount: money, remaining: this.collection.remaining() },
          this.locale,
          () => this.collection.execute(amount),
        ),
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onConfirmed(result, pointName));
  }

  private onConfirmed(
    result: FinanceConfirmResult<CashCollection> | undefined,
    pointName: string,
  ): void {
    if (!result) return;
    if (!result.ok) {
      this.handleError(result.error);
      return;
    }
    this.receipts.set({ kind: 'COLLECTION', pointName, collection: result.result });
    void this.router.navigate(['/cash', 'collect', 'done'], { replaceUrl: true });
  }

  private handleError(error: ApiError): void {
    const outcome = PointMoneyErrorClassifier.classify(error);
    switch (outcome.kind) {
      case 'INSUFFICIENT_CASH':
        this.collection.refuse(this.resolver.resolve(error), outcome.currentPosition);
        break;
      case 'POINT_NOT_ACTIVE':
        this.notifications.error(Labels.PointCollectionNotActiveHint);
        this.leave();
        break;
      case 'POINT_PERMANENTLY_CLOSED':
        this.notifications.error(this.resolver.resolve(error));
        this.leave();
        break;
      case 'SCOPE':
        this.leave();
        break;
      case 'VALIDATION': {
        const unmatched = this.form()?.showServerErrors(error) ?? [];
        if (unmatched.length > 0) this.notifications.error(unmatched.join(' '));
        break;
      }
      default:
        this.notifications.error(this.resolver.resolve(error));
    }
  }
}
