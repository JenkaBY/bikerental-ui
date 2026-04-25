# Task 014: Customer Transactions Tab

> **Applied Skills:** `angular-component` (standalone, OnPush, inject()), `angular-signals` (read-only binding from store), `angular-di` (inject CustomerTransactionsStore), `angular-testing` (Vitest, TestBed).

## 1. Objective

Create `CustomerTransactionsComponent` as a thin consumer of `CustomerTransactionsStore`. On init it calls `store.load()`. Renders a paginated table of transactions with date, description/type, and amount columns. Amount cell uses `transaction.amountColor` CSS class directly — no conditional logic in the template. Pagination events call `store.loadPage(index)`.

## 2. Files to Modify / Create

### File 1 — Component

* **File Path:** `projects/admin/src/app/customers/customer-detail/tabs/customer-transactions/customer-transactions.component.ts`
* **Action:** Create New File

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Labels } from '@bikerental/shared';
import { CustomerTransactionsStore } from '../../customer-transactions.store';

@Component({
  selector: 'app-customer-transactions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    CurrencyPipe,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
  ],
  styles: `
    .amount-positive { color: var(--mat-sys-primary); font-weight: 600; }
    .amount-negative { color: var(--mat-sys-error); font-weight: 600; }
    .amount-neutral  { color: inherit; }
  `,
  template: `
    <div class="p-4 md:p-6">
      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" class="mb-2" />
      }

      @if (!store.loading() && store.transactions().length === 0) {
        <p class="text-slate-400 text-center mt-8">{{ Labels.CustomerTransactionsEmptyState }}</p>
      }

      <table mat-table [dataSource]="store.transactions()" class="w-full">
        <!-- Date column -->
        <ng-container matColumnDef="recordedAt">
          <th mat-header-cell *matHeaderCellDef>{{ Labels.TransactionDateLabel }}</th>
          <td mat-cell *matCellDef="let row">{{ row.recordedAt | date: 'dd MMM yyyy HH:mm' }}</td>
        </ng-container>

        <!-- Description column -->
        <ng-container matColumnDef="description">
          <th mat-header-cell *matHeaderCellDef>{{ Labels.TransactionDescriptionLabel }}</th>
          <td mat-cell *matCellDef="let row">{{ row.description ?? row.sourceType ?? '—' }}</td>
        </ng-container>

        <!-- Amount column -->
        <ng-container matColumnDef="amount">
          <th mat-header-cell *matHeaderCellDef class="text-right">{{ Labels.TransactionAmountLabel }}</th>
          <td mat-cell *matCellDef="let row" class="text-right">
            <span [class]="'amount-' + row.amountColor">
              {{ row.amount.amount | currency: row.amount.currency }}
            </span>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
      </table>

      <mat-paginator
        [length]="store.totalItems()"
        [pageIndex]="store.pageIndex()"
        [pageSize]="store.pageSize()"
        [hidePageSize]="true"
        (page)="onPage($event)"
      />
    </div>
  `,
})
export class CustomerTransactionsComponent implements OnInit {
  protected readonly Labels = Labels;
  protected readonly displayedColumns = ['recordedAt', 'description', 'amount'];

  protected readonly store = inject(CustomerTransactionsStore);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.store.load();
  }

  protected onPage(event: PageEvent): void {
    this.store.loadPage(event.pageIndex);
  }
}
```

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-detail/tabs/customer-transactions/customer-transactions.component.spec.ts`
* **Action:** Create New File

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerTransactionsComponent } from './customer-transactions.component';
import { CustomerTransactionsStore } from '../../customer-transactions.store';

const makeStore = () => ({
  load: vi.fn(),
  loadPage: vi.fn(),
  transactions: signal([]),
  totalItems: signal(0),
  pageIndex: signal(0),
  pageSize: signal(20),
  loading: signal(false),
});

describe('CustomerTransactionsComponent', () => {
  let fixture: ComponentFixture<CustomerTransactionsComponent>;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [CustomerTransactionsComponent],
      providers: [
        { provide: CustomerTransactionsStore, useValue: store },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerTransactionsComponent);
    fixture.detectChanges();
  });

  it('should call store.load() on init', () => {
    expect(store.load).toHaveBeenCalledOnce();
  });

  it('should render empty state when no transactions', () => {
    expect(fixture.nativeElement.textContent).toContain('No transactions');
  });

  it('should call store.loadPage on paginator page event', () => {
    fixture.componentInstance.onPage({ pageIndex: 1, pageSize: 20, length: 100 } as never);
    expect(store.loadPage).toHaveBeenCalledWith(1);
  });
});
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/customer-detail/tabs/customer-transactions/customer-transactions.component.spec.ts
```
