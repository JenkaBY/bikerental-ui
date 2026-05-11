# Task 023: Spec for `RentalEquipmentSectionComponent`

> **Applied Skill:** `angular-testing` — `EquipmentSearchStore` is component-scoped (`providers`), so it is overridden via `overrideComponent`. `RentalStore` is also overridden the same way. No `fakeAsync`/`tick` — debounce lives in the store, not the component. Tests assert `store.search()` is called with the typed value, `searchResults` computed excludes selected IDs, and `addEquipmentItem` is called on selection.

## 1. Objective

Unit tests for `RentalEquipmentSectionComponent`: calling `equipmentSearchStore.search()` on input, exclusion of selected IDs via `searchResults` computed, `addEquipmentItem` on selection, control cleared after selection, `search(null)` called after selection.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-equipment-section.component.spec.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { vi } from 'vitest';
import type { EquipmentSearchItem } from '@bikerental/shared';
import { EquipmentSearchStore, RentalStore } from '@bikerental/shared';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';

const ITEM: EquipmentSearchItem = {
  id: 1,
  uid: 'ABC12',
  model: 'Trek FX3',
  type: { slug: 'bicycle', name: 'Bicycle', isForSpecialTariff: false },
};

function makeRentalStore(items: EquipmentSearchItem[] = []) {
  return {
    equipmentItems: signal(items),
    addEquipmentItem: vi.fn(),
    removeEquipmentItem: vi.fn(),
  };
}

function makeEquipmentSearchStore(results: EquipmentSearchItem[] = []) {
  return {
    search: vi.fn(),
    results: signal(results),
    loading: signal(false),
    searchQuery: signal<string | null>(null),
  };
}

describe('RentalEquipmentSectionComponent', () => {
  let fixture: ComponentFixture<RentalEquipmentSectionComponent>;
  let component: RentalEquipmentSectionComponent;
  let rentalStore: ReturnType<typeof makeRentalStore>;
  let equipmentSearchStore: ReturnType<typeof makeEquipmentSearchStore>;

  async function setup(
    storeItems: EquipmentSearchItem[] = [],
    searchResults: EquipmentSearchItem[] = [],
  ) {
    rentalStore = makeRentalStore(storeItems);
    equipmentSearchStore = makeEquipmentSearchStore(searchResults);

    await TestBed.configureTestingModule({
      imports: [RentalEquipmentSectionComponent],
      providers: [provideAnimationsAsync()],
    })
      .overrideComponent(RentalEquipmentSectionComponent, {
        set: {
          providers: [
            { provide: RentalStore, useValue: rentalStore },
            { provide: EquipmentSearchStore, useValue: equipmentSearchStore },
          ],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalEquipmentSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should call equipmentSearchStore.search() when the control value changes', async () => {
    await setup();
    component['searchControl'].setValue('ABC');
    expect(equipmentSearchStore.search).toHaveBeenCalledWith('ABC');
  });

  it('should expose all store results when no items are selected', async () => {
    await setup([], [ITEM]);
    expect(component['searchResults']()).toEqual([ITEM]);
  });

  it('should exclude already-selected items from searchResults', async () => {
    await setup([ITEM], [ITEM]); // ITEM is both selected and in search results
    expect(component['searchResults']()).toEqual([]);
  });

  it('should call addEquipmentItem when an option is selected', async () => {
    await setup();
    const mockEvent = { option: { value: ITEM } } as never;
    component['onEquipmentSelected'](mockEvent);
    expect(rentalStore.addEquipmentItem).toHaveBeenCalledWith(ITEM);
  });

  it('should clear searchControl after selection', async () => {
    await setup();
    const mockEvent = { option: { value: ITEM } } as never;
    component['onEquipmentSelected'](mockEvent);
    expect(component['searchControl'].value).toBe('');
  });

  it('should call equipmentSearchStore.search(null) after selection', async () => {
    await setup();
    const mockEvent = { option: { value: ITEM } } as never;
    component['onEquipmentSelected'](mockEvent);
    expect(equipmentSearchStore.search).toHaveBeenCalledWith(null);
  });
});
```

> **No `fakeAsync` / `tick` needed:** Debounce and minimum-length filtering live entirely inside `EquipmentSearchStore`. The component calls `store.search(value)` synchronously on every `valueChanges` emission.

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/rental-equipment-section.component.spec**"
```

const ITEM: EquipmentSearchItem = {
id: 1,
uid: 'ABC12',
model: 'Trek FX3',
type: { slug: 'bicycle', name: 'Bicycle', isForSpecialTariff: false },
};

const API_RESPONSE = {
items: [
{ id: 1, uid: 'ABC12', model: 'Trek FX3', type: 'bicycle', status: 'available', serialNumber: 'S1' },
],
totalItems: 1,
};

function makeStore(items: EquipmentSearchItem[] = []) {
return {
equipmentItems: signal(items),
addEquipmentItem: vi.fn(),
removeEquipmentItem: vi.fn(),
};
}

function makeEquipmentService(response = API_RESPONSE) {
return {
searchEquipments: vi.fn().mockReturnValue(of(response)),
};
}

function makeEquipmentTypeStore() {
return {
equipmentTypes: signal([{ slug: 'bicycle', name: 'Bicycle', isForSpecialTariff: false }]),
};
}

describe('RentalEquipmentSectionComponent', () => {
let fixture: ComponentFixture<RentalEquipmentSectionComponent>;
let component: RentalEquipmentSectionComponent;
let store: ReturnType<typeof makeStore>;
let equipmentService: ReturnType<typeof makeEquipmentService>;

async function setup(
storeItems: EquipmentSearchItem[] = [],
serviceResponse = API_RESPONSE,
) {
store = makeStore(storeItems);
equipmentService = makeEquipmentService(serviceResponse);

    await TestBed.configureTestingModule({
      imports: [RentalEquipmentSectionComponent],
      providers: [
        provideAnimationsAsync(),
        { provide: api.EquipmentService, useValue: equipmentService },
        { provide: EquipmentTypeStore, useValue: makeEquipmentTypeStore() },
      ],
    })
      .overrideComponent(RentalEquipmentSectionComponent, {
        set: { providers: [{ provide: RentalStore, useValue: store }] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(RentalEquipmentSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

}

it('should create', async () => {
await setup();
expect(component).toBeTruthy();
});

it('should not call searchEquipments for input shorter than 2 chars', fakeAsync(async () => {
await setup();
component['searchControl'].setValue('A');
tick(300);
expect(equipmentService.searchEquipments).not.toHaveBeenCalled();
}));

it('should call searchEquipments after 300 ms for 2+ char input', fakeAsync(async () => {
await setup();
component['searchControl'].setValue('AB');
tick(300);
expect(equipmentService.searchEquipments).toHaveBeenCalled();
}));

it('should populate searchResults after a successful search', fakeAsync(async () => {
await setup();
component['searchControl'].setValue('ABC');
tick(300);
expect(component['searchResults']().length).toBe(1);
expect(component['searchResults']()[0].uid).toBe('ABC12');
}));

it('should exclude already-selected items from search results', fakeAsync(async () => {
await setup([ITEM]); // item id=1 already selected
component['searchControl'].setValue('ABC');
tick(300);
expect(component['searchResults']().length).toBe(0);
}));

it('should call addEquipmentItem when an option is selected', async () => {
await setup();
const mockEvent = { option: { value: ITEM } } as never;
component['onEquipmentSelected'](mockEvent);
expect(store.addEquipmentItem).toHaveBeenCalledWith(ITEM);
});

it('should clear searchControl after selection', async () => {
await setup();
const mockEvent = { option: { value: ITEM } } as never;
component['onEquipmentSelected'](mockEvent);
expect(component['searchControl'].value).toBe('');
});
});

```

## 4. Validation Steps

```bash
npx ng test operator --include="**/step2/rental-equipment-section.component.spec**"
```
