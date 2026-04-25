# Task 012: Customer Rentals Tab

> **Applied Skills:** `angular-component` (standalone, OnPush, inject()), `angular-signals` (read-only signal binding from store), `angular-di` (inject CustomerRentalsStore), `angular-testing` (Vitest, TestBed).

## 1. Objective

Create `CustomerRentalsComponent` as a thin consumer of `CustomerRentalsStore`. On init it calls `store.load()`. Each row is clickable to expand; expanded rows show equipment items with status chips. A stubbed "New Rental" button shows a snackbar. No HTTP calls or signals live in this component.

## 2. Files to Modify / Create

### File 1 — Component

* **File Path:** `projects/admin/src/app/customers/customer-detail/tabs/customer-rentals/customer-rentals.component.ts`
* **Action:** Create New File

```typescript
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Labels, mapRentalStatus, mapEquipmentItemStatus } from '@bikerental/shared';
import { CustomerRentalsStore } from '../../customer-rentals.store';

@Component({
  selector: 'app-customer-rentals',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    CurrencyPipe,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="p-4 md:p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">{{ Labels.CustomerRentalsTabLabel }}</h2>
        <button mat-stroked-button (click)="newRental()">
          <mat-icon>add</mat-icon>
          {{ Labels.CustomerNewRentalButton }}
        </button>
      </div>

      @if (store.listLoading()) {
        <div class="flex justify-center py-8">
          <mat-spinner diameter="40" />
        </div>
      } @else if (store.rentals().length === 0) {
        <p class="text-slate-400 text-center mt-8">{{ Labels.CustomerRentalsEmptyState }}</p>
      } @else {
        <div class="flex flex-col gap-2">
          @for (rental of store.rentals(); track rental.id) {
            <div
              class="border border-slate-200 rounded-lg overflow-hidden"
              [class.border-primary-300]="store.isExpanded(rental.id)"
            >
              <!-- Collapsed row -->
              <button
                class="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50"
                (click)="store.toggleExpand(rental.id)"
              >
                <mat-icon class="text-slate-400 shrink-0">
                  {{ store.isExpanded(rental.id) ? 'expand_less' : 'expand_more' }}
                </mat-icon>
                <span class="flex-1 text-sm">{{ rental.startedAt | date: 'dd MMM yyyy HH:mm' }}</span>
                <mat-chip [color]="rentalColour(rental.status)" highlighted>
                  {{ rentalLabel(rental.status) }}
                </mat-chip>
              </button>

              <!-- Expanded detail -->
              @if (store.isExpanded(rental.id)) {
                @if (store.loadingDetailIds().has(rental.id)) {
                  <div class="flex justify-center py-4">
                    <mat-spinner diameter="24" />
                  </div>
                } @else if (store.detailCache().get(rental.id); as detail) {
                  <div class="px-4 pb-4 flex flex-col gap-2">
                    @for (item of detail.equipmentItems; track item.equipmentId) {
                      <div class="flex items-center gap-2 text-sm">
                        <span class="text-slate-600">{{ item.equipmentUid ?? item.equipmentId }}</span>
                        <mat-chip [color]="itemColour(item.status)" highlighted>
                          {{ itemLabel(item.status) }}
                        </mat-chip>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class CustomerRentalsComponent implements OnInit {
  protected readonly Labels = Labels;

  protected readonly store = inject(CustomerRentalsStore);
  private readonly snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.store.load();
  }

  protected rentalColour(status: string): string {
    return mapRentalStatus(status).colour;
  }

  protected rentalLabel(status: string): string {
    return mapRentalStatus(status).labelKey;
  }

  protected itemColour(status: string): string {
    return mapEquipmentItemStatus(status).colour;
  }

  protected itemLabel(status: string): string {
    return mapEquipmentItemStatus(status).labelKey;
  }

  protected newRental(): void {
    this.snackBar.open(Labels.CustomerNewRentalComingSoon, undefined, { duration: 3000 });
  }

}
```

---

### File 2 — Unit Test

* **File Path:** `projects/admin/src/app/customers/customer-detail/tabs/customer-rentals/customer-rentals.component.spec.ts`
* **Action:** Create New File

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CustomerRentalsComponent } from './customer-rentals.component';
import { CustomerRentalsStore } from '../../customer-rentals.store';

const makeStore = () => ({
  load: vi.fn(),
  rentals: signal([]),
  expandedIds: signal(new Set<number>()),
  detailCache: signal(new Map()),
  loadingDetailIds: signal(new Set<number>()),
  listLoading: signal(false),
  isExpanded: vi.fn().mockReturnValue(false),
  toggleExpand: vi.fn(),
});

describe('CustomerRentalsComponent', () => {
  let fixture: ComponentFixture<CustomerRentalsComponent>;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [CustomerRentalsComponent],
      providers: [
        { provide: CustomerRentalsStore, useValue: store },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerRentalsComponent);
    fixture.detectChanges();
  });

  it('should call store.load() on init', () => {
    expect(store.load).toHaveBeenCalledOnce();
  });

  it('should render empty state when no rentals', () => {
    expect(fixture.nativeElement.textContent).toContain('No rentals');
  });
});
```

## 4. Validation Steps

```bash
npx ng test admin --watch=false --include=projects/admin/src/app/customers/customer-detail/tabs/customer-rentals/customer-rentals.component.spec.ts
```
