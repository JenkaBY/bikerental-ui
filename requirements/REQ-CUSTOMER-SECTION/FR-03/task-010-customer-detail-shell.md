# Task 010: Customer Detail Shell Component

> **Applied Skills:** `angular-component` (standalone, OnPush, inject()), `angular-routing` (ActivatedRoute, Router, RouterModule), `angular-di` (component-level providers array — this is the DI scope root for all three stores), `angular-testing` (Vitest, TestBed, stub providers).

## 1. Objective

Create `CustomerDetailComponent` as the shell that:

- Declares all three stores in its `providers` array (creates the shared DI scope)
- Reads the `:id` param from the route and calls `CustomerLayoutStore.load(id)` on init
- Renders the header (customer name/phone + balance badges)
- Provides a `mat-tab-nav-bar` linked to the four child routes
- Navigates to `/customers` on Back and on 404

## 2. Files to Modify / Create

### File 1 — Shell Component

* **File Path:** `projects/admin/src/app/customers/customer-detail/customer-detail.component.ts`
* **Action:** Create New File

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';
import { Labels } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';
import { CustomerRentalsStore } from './customer-rentals.store';
import { CustomerTransactionsStore } from './customer-transactions.store';

@Component({
  selector: 'app-customer-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerLayoutStore, CustomerRentalsStore, CustomerTransactionsStore],
  imports: [
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    CurrencyPipe,
  ],
  template: `
    <div class="flex flex-col h-full">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button mat-icon-button [routerLink]="['/customers']" [attr.aria-label]="Labels.CustomerBackButton">
          <mat-icon>arrow_back</mat-icon>
        </button>

        @if (store.profileLoading()) {
          <mat-progress-bar mode="indeterminate" class="flex-1" />
        } @else {
          <div class="flex flex-col flex-1 min-w-0">
            <span class="font-semibold text-slate-800 truncate">
              {{ store.customer()?.firstName }} {{ store.customer()?.lastName }}
            </span>
            <span class="text-sm text-slate-500">{{ store.customer()?.phone }}</span>
          </div>
        }

        <!-- Balance badges -->
        @if (!store.balanceError() && store.balance()) {
          <div class="flex gap-2 text-xs shrink-0">
            <span class="px-2 py-1 rounded-full bg-green-100 text-green-800">
              {{ Labels.CustomerBalanceAvailable }}: {{ store.balance()!.available.amount | currency: store.balance()!.available.currency }}
            </span>
            <span class="px-2 py-1 rounded-full bg-amber-100 text-amber-800">
              {{ Labels.CustomerBalanceReserved }}: {{ store.balance()!.reserved.amount | currency: store.balance()!.reserved.currency }}
            </span>
          </div>
        }
      </div>

      <!-- Tab nav bar -->
      <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="bg-white border-b border-slate-200">
        <a mat-tab-link routerLink="profile" routerLinkActive #rla0="routerLinkActive" [active]="rla0.isActive">
          {{ Labels.CustomerProfileTabLabel }}
        </a>
        <a mat-tab-link routerLink="rentals" routerLinkActive #rla1="routerLinkActive" [active]="rla1.isActive">
          {{ Labels.CustomerRentalsTabLabel }}
        </a>
        <a mat-tab-link routerLink="account" routerLinkActive #rla2="routerLinkActive" [active]="rla2.isActive">
          {{ Labels.CustomerAccountTabLabel }}
        </a>
        <a mat-tab-link routerLink="transactions" routerLinkActive #rla3="routerLinkActive" [active]="rla3.isActive">
          {{ Labels.CustomerTransactionsTabLabel }}
        </a>
      </nav>

      <mat-tab-nav-panel #tabPanel class="flex-1 overflow-auto">
        <router-outlet />
      </mat-tab-nav-panel>
    </div>
  `,
})
export class CustomerDetailComponent implements OnInit {
  protected readonly Labels = Labels;

  protected readonly store = inject(CustomerLayoutStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/customers']);
      return;
    }
    this.store.load(id);
  }
}
```

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-detail/customer-detail.component.spec.ts`
* **Action:** Create New File

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerDetailComponent } from './customer-detail.component';
import { CustomerLayoutStore } from './customer-layout.store';
import { CustomerRentalsStore } from './customer-rentals.store';
import { CustomerTransactionsStore } from './customer-transactions.store';

const makeLayoutStore = () => ({
  load: vi.fn(),
  customer: signal({ id: '1', phone: '+375', firstName: 'Ivan', lastName: 'Ivanov' }),
  balance: signal(null),
  profileLoading: signal(false),
  balanceLoading: signal(false),
  balanceError: signal(false),
  customerId: signal('1'),
});

describe('CustomerDetailComponent', () => {
  let fixture: ComponentFixture<CustomerDetailComponent>;
  let layoutStore: ReturnType<typeof makeLayoutStore>;

  beforeEach(async () => {
    layoutStore = makeLayoutStore();

    await TestBed.configureTestingModule({
      imports: [CustomerDetailComponent],
      providers: [
        provideRouter([]),
        { provide: CustomerLayoutStore, useValue: layoutStore },
        { provide: CustomerRentalsStore, useValue: {} },
        { provide: CustomerTransactionsStore, useValue: {} },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render customer name in header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ivan');
    expect(compiled.textContent).toContain('Ivanov');
  });
});
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/customer-detail/customer-detail.component.spec.ts
```
