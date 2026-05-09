import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import type { EquipmentSearchItem } from '@bikerental/shared';
import { EquipmentSearchStore, RentalStore } from '@bikerental/shared';
import { vi } from 'vitest';
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
    await setup([ITEM], [ITEM]);
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
