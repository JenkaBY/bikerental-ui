# Task 005: Customer List Store & Component

> **Applied Skills:** `angular-component` (standalone, OnPush, inject()), `angular-signals` (signal() for all state), `angular-di` (component-scoped `@Injectable()`, no `providedIn`), `angular-testing` (Vitest, TestBed, stub providers).

## 1. Objective

Create `CustomerListStore` as a component-scoped store that owns all data-fetching and search-debounce logic. Replace the placeholder `CustomerListComponent` with a thin consumer that injects the store and handles navigation. The component must not inject any API service directly.

## 2. Files to Modify / Create

### File 1 — Store

* **File Path:** `projects/admin/src/app/customers/customer-list.store.ts`
* **Action:** Create New File

```typescript
import { Injectable, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { api, Customer, CustomerMapper, Labels } from '@bikerental/shared';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class CustomerListStore {
  private readonly customersService = inject(api.CustomersService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly customers = signal<Customer[]>([]);
  readonly searchQuery = signal('');
  readonly loading = signal(false);

  private readonly search$ = new Subject<string>();

  constructor() {
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          this.loading.set(true);
          return this.customersService.searchByPhone(query);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (results) => {
          this.customers.set(results.map((r) => CustomerMapper.fromResponse(r)));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.customers.set([]);
          this.snackBar.open(Labels.CustomerEmptyState, undefined, { duration: 3000 });
        },
      });

    this.search$.next('');
  }

  search(query: string): void {
    this.searchQuery.set(query);
    this.search$.next(query);
  }
}
```

---

### File 2 — Component

* **File Path:** `projects/admin/src/app/customers/customer-list.component.ts`
* **Action:** Replace Existing File

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { type Customer, Labels } from '@bikerental/shared';
import { CustomerListStore } from './customer-list.store';

@Component({
  selector: 'app-customer-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerListStore],
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatCardModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="p-4 md:p-6">
      <h1 class="text-2xl font-semibold text-slate-800 mb-4">{{ Labels.CustomersTitle }}</h1>

      <mat-form-field appearance="outline" class="w-full mb-4">
        <mat-label>{{ Labels.CustomerSearchPlaceholder }}</mat-label>
        <input
          matInput
          type="text"
          [ngModel]="store.searchQuery()"
          (ngModelChange)="store.search($event)"
        />
      </mat-form-field>

      @if (store.loading()) {
        <mat-progress-bar mode="indeterminate" />
      }

      <!-- Desktop table -->
      <div class="hidden md:block">
        <table mat-table [dataSource]="store.customers()" class="w-full">
          <ng-container matColumnDef="phone">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.CustomerPhoneLabel }}</th>
            <td mat-cell *matCellDef="let row">{{ row.phone }}</td>
          </ng-container>
          <ng-container matColumnDef="firstName">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.CustomerFirstNameLabel }}</th>
            <td mat-cell *matCellDef="let row">{{ row.firstName }}</td>
          </ng-container>
          <ng-container matColumnDef="lastName">
            <th mat-header-cell *matHeaderCellDef>{{ Labels.CustomerLastNameLabel }}</th>
            <td mat-cell *matCellDef="let row">{{ row.lastName }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr
            mat-row
            *matRowDef="let row; columns: displayedColumns"
            class="cursor-pointer hover:bg-slate-50"
            (click)="navigate(row)"
          ></tr>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="flex flex-col gap-2 md:hidden">
        @for (customer of store.customers(); track customer.id) {
          <mat-card class="cursor-pointer" (click)="navigate(customer)">
            <mat-card-content class="py-3">
              <p class="font-medium">{{ customer.phone }}</p>
              <p class="text-sm text-slate-500">{{ customer.firstName }} {{ customer.lastName }}</p>
            </mat-card-content>
          </mat-card>
        } @empty {
          @if (!store.loading()) {
            <p class="text-slate-400 text-center mt-8">{{ Labels.CustomerEmptyState }}</p>
          }
        }
      </div>

      @if (!store.loading() && store.customers().length === 0) {
        <p class="hidden md:block text-slate-400 text-center mt-8">{{ Labels.CustomerEmptyState }}</p>
      }
    </div>
  `,
})
export class CustomerListComponent {
  protected readonly Labels = Labels;
  protected readonly displayedColumns = ['phone', 'firstName', 'lastName'];

  protected readonly store = inject(CustomerListStore);
  private readonly router = inject(Router);

  protected navigate(customer: Customer): void {
    this.router.navigate(['/customers', customer.id]);
  }
}
```

**Note:** `CustomerMapper.fromResponse` accepts `CustomerSearchResponse` because it is a structural subset of `CustomerResponse`. TypeScript accepts this due to structural typing.

---

### File 3 — Store Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-list.store.spec.ts`
* **Action:** Create New File

```typescript
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api } from '@bikerental/shared';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CustomerListStore } from './customer-list.store';

const makeService = () => ({
  searchByPhone: vi.fn().mockReturnValue(of([])),
});

describe('CustomerListStore', () => {
  let store: CustomerListStore;
  let customersService: ReturnType<typeof makeService>;
  const snackOpen = vi.fn();

  beforeEach(() => {
    customersService = makeService();
    TestBed.configureTestingModule({
      providers: [
        CustomerListStore,
        { provide: api.CustomersService, useValue: customersService },
        { provide: MatSnackBar, useValue: { open: snackOpen } },
      ],
    });
    store = TestBed.inject(CustomerListStore);
  });

  it('should trigger initial search on construction', () => {
    expect(customersService.searchByPhone).toHaveBeenCalledWith('');
  });

  it('should map response to Customer domain objects', async () => {
    customersService.searchByPhone.mockReturnValue(
      of([{ id: '1', phone: '+375291234567', firstName: 'Ivan', lastName: 'Ivanov' }]),
    );
    store.search('');
    await new Promise((r) => setTimeout(r, 350));
    expect(store.customers().length).toBe(1);
    expect(store.customers()[0].phone).toBe('+375291234567');
  });

  it('should set loading to false and empty customers on HTTP error', async () => {
    customersService.searchByPhone.mockReturnValue(throwError(() => new Error('500')));
    store.search('123');
    await new Promise((r) => setTimeout(r, 350));
    expect(store.customers()).toEqual([]);
    expect(store.loading()).toBe(false);
    expect(snackOpen).toHaveBeenCalled();
  });
});
```

---

### File 4 — Component Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-list.component.spec.ts`
* **Action:** Create New File

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerListComponent } from './customer-list.component';
import { CustomerListStore } from './customer-list.store';

const makeStore = () => ({
  customers: signal([]),
  searchQuery: signal(''),
  loading: signal(false),
  search: vi.fn(),
});

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        provideRouter([]),
        { provide: CustomerListStore, useValue: store },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call store.search() on input change', () => {
    fixture.componentInstance.store.search('375');
    expect(store.search).toHaveBeenCalledWith('375');
  });

  it('should render empty state when no customers', () => {
    expect(fixture.nativeElement.textContent).toContain('No customers');
  });
});
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/customer-list.component.spec.ts 
```

