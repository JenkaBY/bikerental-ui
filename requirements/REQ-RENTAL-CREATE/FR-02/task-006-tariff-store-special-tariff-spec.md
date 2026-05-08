# Task 006: Add `resolveSpecialTariff()` Tests to `TariffStore` Spec

> **Applied Skill:** `angular-testing` — service unit tests with Vitest; stub injected services via `TestBed.configureTestingModule` value providers; `vi.fn()` for mock observables; test Observable-returning store methods by subscribing and asserting signal state changes.

## 1. Objective

Extend `projects/shared/src/core/state/tariff.store.spec.ts` with a `describe` block that covers `TariffStore.resolveSpecialTariff()`. Tests must verify: (a) the special tariff ID is stored when a SPECIAL-type tariff is found; (b) `EMPTY` is returned and `specialTariffId` stays `null` when no equipment type has `isForSpecialTariff = true`; (c) `EMPTY` is returned and `specialTariffId` stays `null` when `getActiveTariffs` errors.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/tariff.store.spec.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

Add the following to the existing import block at the top of `tariff.store.spec.ts` (the file already imports `of`, `TestBed`, `TariffStore`, `EquipmentTypeStore`, and `PricingTypeStore`):

```typescript
import { throwError } from 'rxjs';
import { EquipmentType } from '../models';
import { TariffsService } from '../api/generated';
```

(Check whether these are already present before adding — only add what is missing.)

**Code to Add/Replace:**

* **Location:** Append a new top-level `describe` block **after** the closing `});` of the last existing `describe` block in the file.

```typescript
describe('TariffStore — resolveSpecialTariff', () => {
  const specialEquipmentType: EquipmentType = {
    slug: 'special-bike',
    name: 'Special Bike',
    isForSpecialTariff: true,
  };

  const regularEquipmentType: EquipmentType = {
    slug: 'regular-bike',
    name: 'Regular Bike',
    isForSpecialTariff: false,
  };

  const makeService = (overrides?: Partial<typeof TariffsService.prototype>) => ({
    getAllTariffs: vi.fn(() => of({ items: [], totalItems: 0 })),
    getActiveTariffs: vi.fn(() => of([])),
    calculateCost: vi.fn(),
    createTariff: vi.fn(),
    updateTariff: vi.fn(),
    ...overrides,
  });

  const makeEquipmentTypeStore = (types: EquipmentType[]) => ({
    types: vi.fn(() => types),
    typesForEquipment: vi.fn(() => types.filter((t) => !t.isForSpecialTariff)),
    loading: vi.fn(() => false),
    load: vi.fn(() => of(undefined)),
  });

  const makePricingTypeStore = () => ({
    pricingTypes: vi.fn(() => []),
  });

  let store: TariffStore;

  async function setup(
    types: EquipmentType[],
    serviceOverrides?: Partial<typeof TariffsService.prototype>,
  ) {
    await TestBed.configureTestingModule({
      providers: [
        TariffStore,
        { provide: TariffsService, useValue: makeService(serviceOverrides) },
        { provide: EquipmentTypeStore, useValue: makeEquipmentTypeStore(types) },
        { provide: PricingTypeStore, useValue: makePricingTypeStore() },
      ],
    }).compileComponents();
    store = TestBed.inject(TariffStore);
  }

  it('should store specialTariffId when a tariff with isSpecial=true is found for the matching equipment type', async () => {
    await setup([regularEquipmentType, specialEquipmentType], {
      getActiveTariffs: vi.fn(() =>
        of([
          {
            id: 77,
            name: 'Special tariff',
            pricingType: 'SPECIAL',
            equipmentType: 'special-bike',
            params: {},
            validFrom: new Date(),
            status: 'ACTIVE',
          },
        ]),
      ),
    });

    store.resolveSpecialTariff().subscribe();

    expect(store.specialTariffId()).toBe(77);
  });

  it('should return EMPTY and leave specialTariffId null when no equipment type has isForSpecialTariff=true', async () => {
    await setup([regularEquipmentType]);

    let emitted = false;
    store.resolveSpecialTariff().subscribe({ complete: () => (emitted = true) });

    expect(emitted).toBe(false);
    expect(store.specialTariffId()).toBeNull();
  });

  it('should return EMPTY and leave specialTariffId null when getActiveTariffs errors', async () => {
    await setup([specialEquipmentType], {
      getActiveTariffs: vi.fn(() => throwError(() => new Error('Network error'))),
    });

    let completed = false;
    store
      .resolveSpecialTariff()
      .subscribe({ next: () => {}, error: () => {}, complete: () => (completed = true) });

    expect(store.specialTariffId()).toBeNull();
  });

  it('should leave specialTariffId null when active tariffs list contains no tariff with isSpecial=true (SPECIAL pricing type)', async () => {
    await setup([specialEquipmentType], {
      getActiveTariffs: vi.fn(() =>
        of([
          {
            id: 10,
            name: 'Flat tariff',
            pricingType: 'FLAT_HOURLY',
            equipmentType: 'special-bike',
            params: {},
            validFrom: new Date(),
            status: 'ACTIVE',
          },
        ]),
      ),
    });

    store.resolveSpecialTariff().subscribe();

    expect(store.specialTariffId()).toBeNull();
  });
});
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npm test -- --project=shared --run --reporter=verbose
```
