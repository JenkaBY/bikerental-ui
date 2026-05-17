# Task 006: RentalListStore Unit Tests

> **Applied Skill:** `angular-testing` — Service tests using TestBed with stub providers via
> `vi.fn()`. Follows the pattern in
> `projects/shared/src/core/state/tariff.store.spec.ts`. The store is provided directly via
> `TestBed.configureTestingModule` providers.

## 1. Objective

Create `projects/operator/src/app/dashboard/rental-list.store.spec.ts` covering BDD scenarios 6
and 7 from `fr.md` — that `loadActive()` populates `activeRentals` with enriched data and that
`loadHistory()` passes the correct date parameters to `RentalsService`.

**Depends on:** Task 004 (store).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/dashboard/rental-list.store.spec.ts`
* **Action:** Create New File

---

## 3. Code Implementation

**Imports Required:**

```typescript
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@bikerental/shared';
import { RentalListStore } from './rental-list.store';
```

**Code to Add:**

* **Location:** New file — full file content

```typescript
import { TestBed } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@bikerental/shared';
import { RentalListStore } from './rental-list.store';

const makeRentalsService = () => ({
  getRentals: vi.fn(),
});

const makeCustomersService = () => ({
  getCustomersBatch: vi.fn().mockReturnValue(of([])),
});

const makeEquipmentsService = () => ({
  getBatchEquipments: vi.fn().mockReturnValue(of([])),
});

describe('RentalListStore', () => {
  let store: RentalListStore;
  let rentalsService: ReturnType<typeof makeRentalsService>;
  let customersService: ReturnType<typeof makeCustomersService>;
  let equipmentsService: ReturnType<typeof makeEquipmentsService>;

  beforeEach(() => {
    rentalsService = makeRentalsService();
    customersService = makeCustomersService();
    equipmentsService = makeEquipmentsService();

    TestBed.configureTestingModule({
      providers: [
        RentalListStore,
        { provide: api.RentalsService, useValue: rentalsService },
        { provide: api.CustomersService, useValue: customersService },
        { provide: api.EquipmentsCatalogueService, useValue: equipmentsService },
      ],
    });
    store = TestBed.inject(RentalListStore);
  });

  // ─── loadActive ────────────────────────────────────────────────────────────

  it('populates activeRentals with enriched customerPhone and equipmentNames (Scenario 6)', () => {
    rentalsService.getRentals.mockReturnValue(
      of({
        items: [
          {
            id: 1,
            status: 'ACTIVE',
            customerId: 'cust-1',
            equipmentIds: [10],
            startedAt: new Date().toISOString(),
          },
          {
            id: 2,
            status: 'ACTIVE',
            customerId: 'cust-2',
            equipmentIds: [],
            startedAt: new Date().toISOString(),
          },
        ],
      }),
    );
    customersService.getCustomersBatch.mockReturnValue(
      of([
        { id: 'cust-1', phone: '+375291111111', firstName: 'Alice', lastName: 'A' },
        { id: 'cust-2', phone: '+375292222222', firstName: 'Bob', lastName: 'B' },
      ]),
    );
    equipmentsService.getBatchEquipments.mockReturnValue(
      of([
        {
          id: 10,
          model: 'Trek FX3',
          uid: 'uid-10',
          type: 'BIKE',
          status: 'ACTIVE',
          serialNumber: 'SN-10',
        },
      ]),
    );

    store.loadActive();

    expect(store.isLoadingActive()).toBe(false);
    expect(store.activeRentals()).toHaveLength(2);
    expect(store.activeRentals()[0].customerPhone).toBe('+375291111111');
    expect(store.activeRentals()[0].equipmentNames).toEqual(['Trek FX3']);
    expect(store.activeRentals()[1].customerPhone).toBe('+375292222222');
    expect(store.activeRentals()[1].equipmentNames).toEqual([]);
  });

  it('sets isLoadingActive to true during the API call and false after completion', () => {
    const subject = new Subject<{ items: never[] }>();
    rentalsService.getRentals.mockReturnValue(subject.asObservable());

    store.loadActive();

    expect(store.isLoadingActive()).toBe(true);

    subject.next({ items: [] });
    subject.complete();

    expect(store.isLoadingActive()).toBe(false);
    expect(store.activeRentals()).toEqual([]);
  });

  it('resets isLoadingActive to false and keeps previous activeRentals on API error', () => {
    rentalsService.getRentals.mockReturnValue(
      new Subject(), // never completes — simulate by using throwError
    );
    const { throwError } = require('rxjs');
    rentalsService.getRentals.mockReturnValue(throwError(() => new Error('network error')));

    store.loadActive();

    expect(store.isLoadingActive()).toBe(false);
    expect(store.activeRentals()).toEqual([]);
  });

  it('skips batch calls and returns empty list when active rentals response is empty', () => {
    rentalsService.getRentals.mockReturnValue(of({ items: [] }));

    store.loadActive();

    expect(customersService.getCustomersBatch).not.toHaveBeenCalled();
    expect(equipmentsService.getBatchEquipments).not.toHaveBeenCalled();
    expect(store.activeRentals()).toEqual([]);
  });

  // ─── loadHistory ───────────────────────────────────────────────────────────

  it('calls getRentals with from and to Date params for the given date strings (Scenario 7)', () => {
    rentalsService.getRentals.mockReturnValue(of({ items: [] }));

    store.loadHistory('2026-05-14', '2026-05-14');

    expect(rentalsService.getRentals).toHaveBeenCalledWith(
      { page: 0, size: 100 },
      undefined,
      undefined,
      undefined,
      new Date('2026-05-14'),
      new Date('2026-05-14'),
    );
    expect(store.historyRentals()).toEqual([]);
  });

  it('populates historyRentals after loadHistory with enriched data', () => {
    rentalsService.getRentals.mockReturnValue(
      of({
        items: [
          {
            id: 20,
            status: 'COMPLETED',
            customerId: 'cust-20',
            equipmentIds: [30],
            startedAt: '2026-05-14T10:00:00Z',
          },
        ],
      }),
    );
    customersService.getCustomersBatch.mockReturnValue(
      of([{ id: 'cust-20', phone: '+375293333333', firstName: 'Carol', lastName: 'C' }]),
    );
    equipmentsService.getBatchEquipments.mockReturnValue(
      of([{ id: 30, model: 'City Bike', uid: 'uid-30', type: 'BIKE', status: 'RETURNED', serialNumber: 'SN-30' }]),
    );

    store.loadHistory('2026-05-14', '2026-05-14');

    expect(store.isLoadingHistory()).toBe(false);
    expect(store.historyRentals()).toHaveLength(1);
    expect(store.historyRentals()[0].customerPhone).toBe('+375293333333');
    expect(store.historyRentals()[0].equipmentNames).toEqual(['City Bike']);
  });

  it('deduplicates customer IDs before calling getCustomersBatch', () => {
    rentalsService.getRentals.mockReturnValue(
      of({
        items: [
          { id: 40, status: 'ACTIVE', customerId: 'cust-same', equipmentIds: [], startedAt: new Date().toISOString() },
          { id: 41, status: 'ACTIVE', customerId: 'cust-same', equipmentIds: [], startedAt: new Date().toISOString() },
        ],
      }),
    );

    store.loadActive();

    expect(customersService.getCustomersBatch).toHaveBeenCalledWith(['cust-same']);
  });
});
```

---

## 4. Validation Steps

```bash
ng test operator --watch=false
```

Expected: all tests in `rental-list.store.spec.ts` pass. Zero failures.
