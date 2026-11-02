# Task 007: `OperatorCashCollectionComponent` (smart page)

> **Applied Skill:** `angular-component` - smart page owns DI, dialog and navigation; the form is the dumb child from task 006. `angular-di` - `RunningShiftStore` and `OperatorCollectionStore` in the component `providers: []` (component-scoped, a fresh instance per visit and per point switch). `angular-signals` - `computed` captions, one `effect()` with `untracked()` for the entry guard. `angular-routing` - `Router.navigate` with route commands (no hand-built URLs; `DeployedPath` is not needed for in-app route commands). AGENTS.md API Error Handling - classify with `PointMoneyErrorClassifier`, copy via `ErrorMessageResolver` + `NotificationService`, no double toast (the request is already sent with `suppressErrorNotification`; `scope.not_established` is toasted by the global interceptor and `RunningShiftStore` skips its own toast for it). Mirrors the refusal logic of `projects/admin/src/app/points/point-money-move-dialog.component.ts`. Requires tasks 001, 002, 004, 005, 006.

## 1. Objective

* On construction: `shiftStore.load(null)` and `points.refreshCurrent()` (silent, fresh status).
* Entry guard (effect, re-runs when the shift or the point status changes): scope lost -> leave silently; shift `none` -> info `Labels.PointShiftNone` + leave; shift running and `current().status !== 'ACTIVE'` -> error `Labels.PointCollectionNotActiveHint` + leave; otherwise `collection.init(shift.expectedCash)` once. `leave()` = `router.navigate(['/cash'], { replaceUrl: true })`, guarded so it runs once.
* Render: `app-page-header` (back arrow -> `leave()`, nothing sent), title `Labels.OperatorHandInCash`; `loading` progress bar; `failed` message + Retry; `running` and `collection.ready()` -> the form.
* Submit: opens `FinanceConfirmDialogComponent` via `buildCollectionConfirm`; `execute` = `collection.execute(amount)`. Back in the dialog -> closes with `undefined` -> nothing happens, amount kept.
* Success: `FinanceReceiptStore.set({ kind: 'COLLECTION', pointName, collection })`, then `router.navigate(['/cash', 'collect', 'done'], { replaceUrl: true })`.
* Refusals: `INSUFFICIENT_CASH` -> `collection.refuse(resolver.resolve(error), outcome.currentPosition)` (available from `params.cashPosition`, error under the amount, the next attempt gets a new key because the outcome was definitive); `POINT_NOT_ACTIVE` -> error `Labels.PointCollectionNotActiveHint` + leave; `POINT_PERMANENTLY_CLOSED` -> error `resolver.resolve(error)` + leave; `SCOPE` -> leave only; `VALIDATION` -> `form.showServerErrors(error)`, unmatched messages joined into one error toast; anything else -> error `resolver.resolve(error)`, form and amount kept.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/operator-cash-collection.component.ts` - **Action:** Create New File

## 3. Code Implementation

* **Location:** new file, whole content:

```typescript
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
    this.shiftStore.load(null);
    this.points.refreshCurrent().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    effect(() => {
      const scopeLost = this.scope.notEstablished();
      const state = this.shiftStore.state();
      const shift = this.shiftStore.shift();
      const status = this.points.current()?.status ?? null;
      untracked(() => {
        if (scopeLost) {
          this.leave();
        } else if (state === 'none') {
          this.notifications.info(Labels.PointShiftNone);
          this.leave();
        } else if (state === 'running' && shift) {
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
```

If the file exceeds ~200 lines after Prettier, do NOT split it further; report the line count in the task result.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/operator-cash-collection.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
