import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  LOCALE_ID,
  untracked,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Router } from '@angular/router';
import {
  type ApiError,
  buildShiftClosureConfirm,
  CurrentPointStore,
  ErrorMessageResolver,
  type FinanceConfirmData,
  FinanceConfirmDialogComponent,
  type FinanceConfirmResult,
  FinanceReceiptStore,
  Labels,
  NotificationService,
  OperatingScopeStore,
  PageHeaderComponent,
  PointMoneyErrorClassifier,
  RunningShiftStore,
  type ShiftClosure,
  ShiftClosureStore,
  ShiftCountFormComponent,
} from '@bikerental/shared';

@Component({
  selector: 'app-operator-shift-closure',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RunningShiftStore, ShiftClosureStore],
  imports: [MatButtonModule, MatProgressBarModule, PageHeaderComponent, ShiftCountFormComponent],
  template: `
    <div class="flex flex-col gap-4">
      <app-page-header
        class="block -mx-4 -mt-4"
        [title]="labels.PointCloseShift"
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
          @if (shiftStore.shift(); as shift) {
            <app-shift-count-form
              layout="mobile"
              [shift]="shift"
              [pointName]="pointName()"
              [differenceText]="closure.differenceText()"
              (countedChange)="closure.setCounted($event)"
              (submitted)="onSubmit()"
            />
            <button
              mat-flat-button
              type="button"
              class="!h-12 w-full"
              [disabled]="closure.counted() === null || closure.submitting()"
              (click)="onSubmit()"
            >
              {{ labels.PointCloseShift }}
            </button>
          }
        }
      }
    </div>
  `,
})
export class OperatorShiftClosureComponent {
  protected readonly labels = Labels;
  protected readonly shiftStore = inject(RunningShiftStore);
  protected readonly closure = inject(ShiftClosureStore);

  private readonly points = inject(CurrentPointStore);
  private readonly scope = inject(OperatingScopeStore);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly receipts = inject(FinanceReceiptStore);
  private readonly locale = inject(LOCALE_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly form = viewChild(ShiftCountFormComponent);
  private left = false;

  protected readonly pointName = computed(() => this.points.current()?.name ?? '');

  constructor() {
    if (!this.scope.notEstablished() && this.points.currentSlug() !== null) {
      this.shiftStore.load(null);
    }
    effect(() => {
      const noPoint = this.scope.notEstablished() || this.points.currentSlug() === null;
      const state = this.shiftStore.state();
      const shift = this.shiftStore.shift();
      untracked(() => {
        if (this.left) return;
        if (noPoint) {
          this.leave();
        } else if (state === 'none') {
          this.notifications.info(Labels.PointShiftNone);
          this.leave();
        } else if (state === 'running' && shift && this.closure.shift() === null) {
          this.closure.init(shift, null);
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

  protected onSubmit(): void {
    const shift = this.closure.shift();
    const counted = this.closure.counted();
    const difference = this.closure.difference();
    if (!shift || !counted || !difference || this.closure.submitting()) return;
    const pointName = this.pointName();
    this.dialog
      .open<
        FinanceConfirmDialogComponent,
        FinanceConfirmData<ShiftClosure>,
        FinanceConfirmResult<ShiftClosure>
      >(FinanceConfirmDialogComponent, {
        data: buildShiftClosureConfirm({ shift, counted, difference }, this.locale, () =>
          this.closure.execute(),
        ),
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onConfirmed(result, pointName));
  }

  private onConfirmed(
    result: FinanceConfirmResult<ShiftClosure> | undefined,
    pointName: string,
  ): void {
    if (!result) return;
    if (!result.ok) {
      this.handleError(result.error);
      return;
    }
    this.receipts.set({ kind: 'SHIFT_CLOSURE', pointName, closure: result.result });
    void this.router.navigate(['/cash', 'close-shift', 'done'], { replaceUrl: true });
  }

  private handleError(error: ApiError): void {
    const outcome = PointMoneyErrorClassifier.classifyClosure(error);
    switch (outcome.kind) {
      case 'SHIFT_NOT_RUNNING':
        this.notifications.warn(Labels.ShiftClosureAlreadyClosed);
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
