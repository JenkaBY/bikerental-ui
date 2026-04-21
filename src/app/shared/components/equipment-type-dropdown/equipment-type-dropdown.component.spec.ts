import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EquipmentTypeDropdownComponent } from './equipment-type-dropdown.component';
import { EquipmentTypeStore } from '@store.equipment-type.store';
import { EquipmentType } from '@ui-models';

const mockTypes: EquipmentType[] = [
  { slug: 'bike', name: 'Bike', isForSpecialTariff: false },
  { slug: 'scooter', name: 'Scooter', isForSpecialTariff: false },
];

function makeStore(types: EquipmentType[] = mockTypes) {
  return {
    types: vi.fn().mockReturnValue(types),
    loading: vi.fn().mockReturnValue(false),
    load: vi.fn().mockReturnValue(of(undefined)),
  };
}

describe('EquipmentTypeDropdownComponent', () => {
  let fixture: ComponentFixture<EquipmentTypeDropdownComponent>;
  let component: EquipmentTypeDropdownComponent;
  let store: ReturnType<typeof makeStore>;

  async function setup(types: EquipmentType[] = mockTypes) {
    store = makeStore(types);

    await TestBed.configureTestingModule({
      imports: [EquipmentTypeDropdownComponent],
      providers: [{ provide: EquipmentTypeStore, useValue: store }],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentTypeDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create and load types', async () => {
    await setup();
    expect(component).toBeTruthy();
    expect(store.load).toHaveBeenCalledOnce();
    expect(component.types().length).toBe(mockTypes.length);
  });

  it('writeValue sets selected value', async () => {
    await setup();
    component.writeValue('scooter');
    expect(component.value()).toBe('scooter');
  });

  it('registerOnChange is called when selecting option', async () => {
    await setup();
    const onChange = vi.fn();
    const onTouched = vi.fn();
    component.registerOnChange(onChange);
    component.registerOnTouched(onTouched);
    component.onSelect('bike');
    expect(component.value()).toBe('bike');
    expect(onChange).toHaveBeenCalledWith('bike');
    expect(onTouched).toHaveBeenCalled();
  });

  it('setDisabledState disables the control', async () => {
    await setup();
    component.setDisabledState(true);
    expect(component.isDisabled()).toBe(true);
  });
});
