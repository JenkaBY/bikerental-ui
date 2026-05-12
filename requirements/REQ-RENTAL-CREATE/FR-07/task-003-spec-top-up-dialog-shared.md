# Task 003: Spec for Shared `TopUpDialogComponent`

> **Applied Skill:** `angular-testing` — Dialog component spec. Provide `FinanceService` and `UserStore` as value stubs via `providers`. Provide `MatDialogRef` and `MAT_DIALOG_DATA` as value providers. Covers: create, confirm success closes with `true`, confirm failure shows snackbar and keeps open, invalid form skips API call, idempotency key is stable across retries.

> **⚠️ Prerequisite:** Requires **task-001** and **task-002** to be completed first.

## 1. Objective

Unit-test the shared `TopUpDialogComponent` in isolation. The `FinanceService` stub replaces the previously used `CustomerFinanceStore` stub. All five original test scenarios from the deleted admin spec are reproduced against the new service-based implementation.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/components/top-up-dialog/top-up-dialog.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FinanceService } from '../../../core/api/generated/services/finance.service';
import { UserStore } from '../../../core/state/user.store';
import { TopUpDialogComponent } from './top-up-dialog.component';

const makeFinanceService = () => ({
  recordDeposit: vi.fn().mockReturnValue(of({ transactionId: 't1', recordedAt: new Date() })),
});

const makeUserStore = () => ({
  currentUser: signal<{ id: string } | null>({ id: 'op1' }),
});

describe('TopUpDialogComponent', () => {
  let fixture: ComponentFixture<TopUpDialogComponent>;
  let financeService: ReturnType<typeof makeFinanceService>;
  const dialogClose = vi.fn();
  const snackOpen = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    financeService = makeFinanceService();
    await TestBed.configureTestingModule({
      imports: [TopUpDialogComponent],
      providers: [
        { provide: FinanceService, useValue: financeService },
        { provide: UserStore, useValue: makeUserStore() },
        { provide: MatDialogRef, useValue: { close: dialogClose } },
        { provide: MAT_DIALOG_DATA, useValue: { customerId: 'c1' } },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(TopUpDialogComponent);
    fixture.detectChanges();
  });

  it('should create', () => expect(fixture.componentInstance).toBeTruthy());

  it('should close with true on successful deposit', () => {
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    fixture.componentInstance.confirm();
    expect(dialogClose).toHaveBeenCalledWith(true);
  });

  it('should show error snackbar and stay open on failure', async () => {
    financeService.recordDeposit.mockReturnValue(throwError(() => new Error('500')));
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    fixture.componentInstance.confirm();
    await Promise.resolve();
    expect(fixture.componentInstance['errorShown']).toBe(true);
    expect(dialogClose).not.toHaveBeenCalled();
  });

  it('should not call recordDeposit when form is invalid', () => {
    fixture.componentInstance.confirm();
    expect(financeService.recordDeposit).not.toHaveBeenCalled();
  });

  it('should reuse the same idempotencyKey on retry', () => {
    fixture.componentInstance.form.setValue({ amount: 50, paymentMethod: 'CASH' });
    financeService.recordDeposit.mockReturnValueOnce(throwError(() => new Error('500')));
    fixture.componentInstance.confirm();
    fixture.componentInstance.confirm();
    const firstCallArg = financeService.recordDeposit.mock.calls[0][0];
    const secondCallArg = financeService.recordDeposit.mock.calls[1][0];
    expect(firstCallArg.idempotencyKey).toBe(secondCallArg.idempotencyKey);
  });
});
```

## 4. Validation Steps

```bash
npm test -- --project=shared --testPathPattern=top-up-dialog
```
