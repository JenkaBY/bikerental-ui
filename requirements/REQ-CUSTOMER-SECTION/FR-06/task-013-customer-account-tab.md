# Task 013: Customer Account Tab

> **Applied Skills:** `angular-component` (standalone, OnPush, inject()), `angular-di` (inject CustomerLayoutStore + CustomerTransactionsStore cross-tab), `angular-testing` (Vitest, MatDialog stub).

## 1. Objective

Create `CustomerAccountComponent`. It reads the balance from `CustomerLayoutStore`, renders available/reserved balances, opens `TopUpDialogComponent` and `WithdrawDialogComponent` via `MatDialog`, and on `true` result calls `store.refreshBalance()` then `transactionsStore.invalidate()`.

The Withdraw button is disabled when `balance?.available.amount === 0` or balance is null.

## 2. Files to Modify / Create

### File 1 — Component

* **File Path:** `projects/admin/src/app/customers/customer-detail/tabs/customer-account/customer-account.component.ts`
* **Action:** Create New File

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Labels } from '@bikerental/shared';
import { CustomerLayoutStore } from '../../customer-layout.store';
import { CustomerTransactionsStore } from '../../customer-transactions.store';
import { TopUpDialogComponent } from '../../../dialogs/top-up-dialog/top-up-dialog.component';
import { WithdrawDialogComponent } from '../../../dialogs/withdraw-dialog/withdraw-dialog.component';

@Component({
  selector: 'app-customer-account',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe, MatButtonModule],
  template: `
    <div class="p-4 md:p-6 max-w-sm">
      <dl class="flex flex-col gap-4 mb-6">
        <div>
          <dt class="text-xs text-slate-500">{{ Labels.CustomerBalanceAvailable }}</dt>
          <dd class="text-2xl font-semibold">
            @if (store.balance(); as bal) {
              {{ bal.available.amount | currency: bal.available.currency }}
            } @else {
              —
            }
          </dd>
        </div>
        <div>
          <dt class="text-xs text-slate-500">{{ Labels.CustomerBalanceReserved }}</dt>
          <dd class="text-xl">
            @if (store.balance(); as bal) {
              {{ bal.reserved.amount | currency: bal.reserved.currency }}
            } @else {
              —
            }
          </dd>
        </div>
      </dl>

      <div class="flex gap-3">
        <button mat-flat-button (click)="openTopUp()">{{ Labels.CustomerTopUpButton }}</button>
        <button
          mat-stroked-button
          [disabled]="withdrawDisabled()"
          (click)="openWithdraw()"
        >
          {{ Labels.CustomerWithdrawButton }}
        </button>
      </div>
    </div>
  `,
})
export class CustomerAccountComponent {
  protected readonly Labels = Labels;

  protected readonly store = inject(CustomerLayoutStore);
  private readonly transactionsStore = inject(CustomerTransactionsStore);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  protected withdrawDisabled(): boolean {
    const bal = this.store.balance();
    return !bal || bal.available.amount <= 0;
  }

  protected openTopUp(): void {
    this.dialog
      .open(TopUpDialogComponent, {
        data: { customerId: this.store.customerId() },
        width: '380px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.store.refreshBalance();
          this.transactionsStore.invalidate();
          this.snackBar.open(Labels.CustomerTopUpSuccess, undefined, { duration: 3000 });
        }
      });
  }

  protected openWithdraw(): void {
    const bal = this.store.balance();
    this.dialog
      .open(WithdrawDialogComponent, {
        data: { customerId: this.store.customerId(), availableBalance: bal?.available },
        width: '380px',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => {
        if (result) {
          this.store.refreshBalance();
          this.transactionsStore.invalidate();
          this.snackBar.open(Labels.CustomerWithdrawSuccess, undefined, { duration: 3000 });
        }
      });
  }
}
```

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-detail/tabs/customer-account/customer-account.component.spec.ts`
* **Action:** Create New File

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerAccountComponent } from './customer-account.component';
import { CustomerLayoutStore } from '../../customer-layout.store';
import { CustomerTransactionsStore } from '../../customer-transactions.store';

const makeLayoutStore = () => ({
  balance: signal({ available: { amount: 100, currency: 'BYN' }, reserved: { amount: 20, currency: 'BYN' }, lastUpdatedAt: new Date() }),
  customerId: signal('c1'),
  refreshBalance: vi.fn(),
});

const makeTransactionsStore = () => ({ invalidate: vi.fn() });

const makeDialog = (result: unknown) => ({
  open: vi.fn().mockReturnValue({ afterClosed: () => of(result) }),
});

describe('CustomerAccountComponent', () => {
  let fixture: ComponentFixture<CustomerAccountComponent>;
  let layoutStore: ReturnType<typeof makeLayoutStore>;
  let transactionsStore: ReturnType<typeof makeTransactionsStore>;
  let dialog: ReturnType<typeof makeDialog>;
  const snackOpen = vi.fn();

  const setup = async (dialogResult: unknown) => {
    layoutStore = makeLayoutStore();
    transactionsStore = makeTransactionsStore();
    dialog = makeDialog(dialogResult);

    await TestBed.configureTestingModule({
      imports: [CustomerAccountComponent],
      providers: [
        { provide: CustomerLayoutStore, useValue: layoutStore },
        { provide: CustomerTransactionsStore, useValue: transactionsStore },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerAccountComponent);
    fixture.detectChanges();
  };

  it('should render available balance', async () => {
    await setup(undefined);
    expect(fixture.nativeElement.textContent).toContain('100');
  });

  it('should call refreshBalance and invalidate on top up success', async () => {
    await setup(true);
    fixture.componentInstance.openTopUp();
    expect(layoutStore.refreshBalance).toHaveBeenCalled();
    expect(transactionsStore.invalidate).toHaveBeenCalled();
  });

  it('should not call refreshBalance on dialog cancel', async () => {
    await setup(undefined);
    fixture.componentInstance.openTopUp();
    expect(layoutStore.refreshBalance).not.toHaveBeenCalled();
  });

  it('should disable withdraw when balance is zero', async () => {
    await setup(undefined);
    layoutStore.balance.set({ available: { amount: 0, currency: 'BYN' }, reserved: { amount: 0, currency: 'BYN' }, lastUpdatedAt: new Date() });
    fixture.detectChanges();
    expect(fixture.componentInstance.withdrawDisabled()).toBe(true);
  });
});
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/customer-detail/tabs/customer-account/customer-account.component.spec.ts
```
