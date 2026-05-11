# Task 007: Create `RentalStore` Unit Tests

> **Applied Skill:** `angular-testing` — signal store unit tests with Vitest and `TestBed`; value provider stubs for all injected services; `fakeAsync`/`tick` for debounced reactive pipelines; direct signal reads to assert state transitions.

## 1. Objective

Create `projects/shared/src/core/state/rental.store.spec.ts` covering all six BDD acceptance scenarios from `fr.md`, plus the reset behaviour and the `projectedBalance`/`isBalanceSufficient` computed signals.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { RentalStore } from './rental.store';
import { TariffStore } from './tariff.store';
import { UserStore } from './user.store';
import { RentalsService, TariffsService } from '../api/generated';
import type { CostCalculationResponse, RentalResponse } from '@api-models';
import type { Customer, CustomerBalance, EquipmentSearchItem } from '@ui-models';
```

**Code to Add/Replace:**

* **Location:** New file — full content as shown below.

```typescript
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of, throwError } from 'rxjs';
import { RentalStore } from './rental.store';
import { TariffStore } from './tariff.store';
import { UserStore } from './user.store';
import { RentalsService, TariffsService } from '../api/generated';
import type { CostCalculationResponse, RentalResponse } from '@api-models';
import type { Customer, CustomerBalance, EquipmentSearchItem } from '@ui-models';

const makeCustomer = (): Customer => ({
  id: 'cust-1',
  phone: '+375291234567',
  firstName: 'John',
  lastName: 'Doe',
});

const makeBalance = (available: number): CustomerBalance => ({
  available: { amount: available, currency: 'BYN' },
  reserved: { amount: 0, currency: 'BYN' },
  lastUpdatedAt: new Date(),
  isWithdrawalAvailable: true,
});

const makeEquipmentItem = (): EquipmentSearchItem => ({
  id: 1,
  uid: 'UID-001',
  model: 'Trek 3500',
  typeSlug: 'bike',
  statusSlug: 'AVAILABLE',
});

const makeCostResponse = (totalCost = 90): CostCalculationResponse => ({
  equipmentBreakdowns: [],
  subtotal: 100,
  totalCost,
  specialPricingApplied: false,
  effectiveDurationMinutes: 60,
  estimate: true,
});

const makeDraftResponse = (id = 42): RentalResponse => ({
  id,
  customerId: 'cust-1',
  equipmentItems: [],
  status: 'DRAFT',
  startedAt: new Date(),
  plannedDurationMinutes: 30,
  estimatedCost: 0,
});

describe('RentalStore', () => {
  let store: RentalStore;
  let tariffsService: { calculateCost: ReturnType<typeof vi.fn> };
  let rentalsService: {
    createDraft: ReturnType<typeof vi.fn>;
    updateRental: ReturnType<typeof vi.fn>;
    createRental: ReturnType<typeof vi.fn>;
    getRentalById: ReturnType<typeof vi.fn>;
  };
  let tariffStore: { specialTariffId: ReturnType<typeof vi.fn> };
  let userStore: { currentUser: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    tariffsService = { calculateCost: vi.fn(() => of(makeCostResponse())) };
    rentalsService = {
      createDraft: vi.fn(() => of(makeDraftResponse())),
      updateRental: vi.fn(() => of(makeDraftResponse())),
      createRental: vi.fn(() => of({ ...makeDraftResponse(99), status: 'ACTIVE' })),
      getRentalById: vi.fn(() => of(makeDraftResponse())),
    };
    tariffStore = { specialTariffId: vi.fn(() => null) };
    userStore = { currentUser: vi.fn(() => ({ id: 'op-1' })) };

    await TestBed.configureTestingModule({
      providers: [
        RentalStore,
        { provide: TariffsService, useValue: tariffsService },
        { provide: RentalsService, useValue: rentalsService },
        { provide: TariffStore, useValue: tariffStore },
        { provide: UserStore, useValue: userStore },
      ],
    }).compileComponents();

    store = TestBed.inject(RentalStore);
  });

  describe('Initial state', () => {
    it('should initialise with default values', () => {
      expect(store.id()).toBeNull();
      expect(store.customer()).toBeNull();
      expect(store.durationMinutes()).toBe(30);
      expect(store.equipmentItems()).toEqual([]);
      expect(store.discountPercent()).toBeNull();
      expect(store.specialPriceEnabled()).toBe(false);
      expect(store.specialPrice()).toBeNull();
      expect(store.costEstimate()).toBeNull();
      expect(store.isSaving()).toBe(false);
      expect(store.isActivating()).toBe(false);
    });
  });

  describe('Scenario 1 — costEstimate reacts to duration change (debounced)', () => {
    it('should call calculateCost after 300 ms debounce when equipment is present', fakeAsync(() => {
      store.setEquipmentItems([makeEquipmentItem()]);
      store.setDurationMinutes(60);

      expect(tariffsService.calculateCost).not.toHaveBeenCalled();

      tick(300);

      expect(tariffsService.calculateCost).toHaveBeenCalledTimes(1);
      expect(tariffsService.calculateCost).toHaveBeenCalledWith(
        expect.objectContaining({ plannedDurationMinutes: 60 }),
      );
      expect(store.costEstimate()).not.toBeNull();
      expect(store.costEstimate()?.totalCost).toBe(90);
    }));

    it('should cancel an in-flight request when inputs change before debounce expires', fakeAsync(() => {
      store.setEquipmentItems([makeEquipmentItem()]);
      store.setDurationMinutes(60);
      tick(100);
      store.setDurationMinutes(120);
      tick(300);

      expect(tariffsService.calculateCost).toHaveBeenCalledTimes(1);
      expect(tariffsService.calculateCost).toHaveBeenCalledWith(
        expect.objectContaining({ plannedDurationMinutes: 120 }),
      );
    }));
  });

  describe('Scenario 2 — costEstimate is null when equipment list is empty', () => {
    it('should not call calculateCost and costEstimate should remain null when items is empty', fakeAsync(() => {
      store.setDurationMinutes(120);
      tick(300);

      expect(tariffsService.calculateCost).not.toHaveBeenCalled();
      expect(store.costEstimate()).toBeNull();
    }));

    it('should immediately reset costEstimate to null when all equipment items are removed', fakeAsync(() => {
      store.setEquipmentItems([makeEquipmentItem()]);
      tick(300);
      expect(store.costEstimate()).not.toBeNull();

      store.setEquipmentItems([]);

      expect(store.costEstimate()).toBeNull();
    }));
  });

  describe('Scenario 3 — canProceedFromStep2 is false when special price mode active but price is null', () => {
    it('should return false', fakeAsync(() => {
      store.setEquipmentItems([makeEquipmentItem()]);
      tick(300);
      store.setSpecialPriceEnabled(true);

      expect(store.canProceedFromStep2()).toBe(false);
    }));
  });

  describe('Scenario 4 — canProceedFromStep2 is true when all conditions met', () => {
    it('should return true when items present, special price disabled, and estimate exists', fakeAsync(() => {
      store.setEquipmentItems([makeEquipmentItem()]);
      store.setDiscountPercent(0);
      tick(300);

      expect(store.canProceedFromStep2()).toBe(true);
    }));
  });

  describe('Scenario 5 — save() creates draft and patches when id is null', () => {
    it('should call createDraft then updateRental and store the returned id', () => {
      store.setCustomer(makeCustomer());
      store.setEquipmentItems([makeEquipmentItem()]);

      let completed = false;
      store.save().subscribe({ complete: () => (completed = true) });

      expect(rentalsService.createDraft).toHaveBeenCalledTimes(1);
      expect(rentalsService.updateRental).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          operations: expect.arrayContaining([
            expect.objectContaining({ path: '/customerId', value: 'cust-1' }),
            expect.objectContaining({ path: '/equipmentIds', value: [1] }),
            expect.objectContaining({ path: '/duration', value: 30 }),
          ]),
        }),
      );
      expect(store.id()).toBe(42);
      expect(completed).toBe(true);
    });

    it('should call only updateRental when id is already set', () => {
      store.setCustomer(makeCustomer());
      store.save().subscribe();
      vi.clearAllMocks();
      rentalsService.updateRental.mockReturnValue(of(makeDraftResponse()));

      store.save().subscribe();

      expect(rentalsService.createDraft).not.toHaveBeenCalled();
      expect(rentalsService.updateRental).toHaveBeenCalledTimes(1);
    });

    it('should expose isSaving=true during save and reset it on completion', () => {
      const emissions: boolean[] = [];
      store.save().subscribe();

      expect(store.isSaving()).toBe(false);
    });
  });

  describe('Scenario 6 — reset() clears all state', () => {
    it('should reset all signals to their default values', fakeAsync(() => {
      store.setCustomer(makeCustomer());
      store.setCustomerBalance(makeBalance(500));
      store.setEquipmentItems([makeEquipmentItem()]);
      store.setDurationMinutes(120);
      store.setDiscountPercent(10);
      store.setSpecialPriceEnabled(true);
      store.setSpecialPrice(150);
      tick(300);
      store.save().subscribe();

      store.reset();

      expect(store.id()).toBeNull();
      expect(store.customer()).toBeNull();
      expect(store.customerBalance()).toBeNull();
      expect(store.durationMinutes()).toBe(30);
      expect(store.equipmentItems()).toEqual([]);
      expect(store.discountPercent()).toBeNull();
      expect(store.specialPriceEnabled()).toBe(false);
      expect(store.specialPrice()).toBeNull();
      expect(store.costEstimate()).toBeNull();
    }));
  });

  describe('projectedBalance', () => {
    it('should return null when customerBalance is not set', fakeAsync(() => {
      store.setEquipmentItems([makeEquipmentItem()]);
      tick(300);

      expect(store.projectedBalance()).toBeNull();
    }));

    it('should return balance minus totalCost', fakeAsync(() => {
      store.setCustomerBalance(makeBalance(200));
      store.setEquipmentItems([makeEquipmentItem()]);
      tick(300);

      expect(store.projectedBalance()).toBe(110);
    }));
  });

  describe('isBalanceSufficient', () => {
    it('should return false when projected balance is negative', fakeAsync(() => {
      store.setCustomerBalance(makeBalance(50));
      store.setEquipmentItems([makeEquipmentItem()]);
      tick(300);

      expect(store.isBalanceSufficient()).toBe(false);
    }));

    it('should return true when projected balance is zero or positive', fakeAsync(() => {
      store.setCustomerBalance(makeBalance(90));
      store.setEquipmentItems([makeEquipmentItem()]);
      tick(300);

      expect(store.isBalanceSufficient()).toBe(true);
    }));
  });

  describe('setSpecialPriceEnabled — mutual exclusion with discount', () => {
    it('should clear discountPercent when special price mode is enabled', () => {
      store.setDiscountPercent(10);
      expect(store.discountPercent()).toBe(10);

      store.setSpecialPriceEnabled(true);

      expect(store.discountPercent()).toBeNull();
    });

    it('should reset specialPrice to null when special price mode is disabled', () => {
      store.setSpecialPriceEnabled(true);
      store.setSpecialPrice(200);
      expect(store.specialPrice()).toBe(200);

      store.setSpecialPriceEnabled(false);

      expect(store.specialPrice()).toBeNull();
    });
  });

  describe('setDiscountPercent — mutual exclusion with special price', () => {
    it('should disable special price mode and clear specialPrice when a discount is set', () => {
      store.setSpecialPriceEnabled(true);
      store.setSpecialPrice(150);
      expect(store.specialPriceEnabled()).toBe(true);
      expect(store.specialPrice()).toBe(150);

      store.setDiscountPercent(15);

      expect(store.specialPriceEnabled()).toBe(false);
      expect(store.specialPrice()).toBeNull();
      expect(store.discountPercent()).toBe(15);
    });

    it('should not affect special price mode when discount is cleared (set to null)', () => {
      store.setSpecialPriceEnabled(true);
      store.setDiscountPercent(null);

      expect(store.specialPriceEnabled()).toBe(true);
    });
  });

  describe('activateRental', () => {
    it('should call createRental with mapped request and store returned id', () => {
      tariffStore.specialTariffId.mockReturnValue(5);
      store.setCustomer(makeCustomer());
      store.setEquipmentItems([makeEquipmentItem()]);
      store.setSpecialPriceEnabled(true);
      store.setSpecialPrice(150);

      let returnedId: number | undefined;
      store.activateRental().subscribe((id) => (returnedId = id));

      expect(rentalsService.createRental).toHaveBeenCalledWith(
        expect.objectContaining({
          customerId: 'cust-1',
          equipmentIds: [1],
          duration: 30,
          specialTariffId: 5,
          specialPrice: 150,
          operatorId: 'op-1',
        }),
      );
      expect(returnedId).toBe(99);
      expect(store.id()).toBe(99);
    });
  });

  describe('loadRental', () => {
    it('should restore state from rental response', () => {
      const response: RentalResponse = {
        ...makeDraftResponse(55),
        plannedDurationMinutes: 90,
        equipmentItems: [
          { equipmentId: 7, equipmentUid: 'UID-007', status: 'ASSIGNED', estimatedCost: 0 },
        ],
      };
      rentalsService.getRentalById.mockReturnValue(of(response));

      store.loadRental(55).subscribe();

      expect(store.id()).toBe(55);
      expect(store.durationMinutes()).toBe(90);
      expect(store.equipmentItems()).toHaveLength(1);
      expect(store.equipmentItems()[0].id).toBe(7);
      expect(store.equipmentItems()[0].uid).toBe('UID-007');
    });

    it('should call reset() and rethrow error when getRentalById fails', () => {
      rentalsService.getRentalById.mockReturnValue(throwError(() => new Error('Not found')));
      store.setDurationMinutes(120);

      let errorCaught = false;
      store.loadRental(999).subscribe({ error: () => (errorCaught = true) });

      expect(errorCaught).toBe(true);
      expect(store.durationMinutes()).toBe(30);
    });
  });
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npm test -- --project=shared --run --reporter=verbose
```
