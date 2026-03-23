import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EquipmentTypeDropdownComponent } from './equipment-type-dropdown.component';
import { EquipmentTypeService } from '../../../core/api';
import { EquipmentType } from '../../../core/domain';

const mockTypes: EquipmentType[] = [
  { slug: 'bike', name: 'Bike' },
  { slug: 'scooter', name: 'Scooter' },
];

function makeService(types: EquipmentType[] = mockTypes) {
  return { getAll: vi.fn().mockReturnValue(of(types)) };
}

describe('EquipmentTypeDropdownComponent', () => {
  let fixture: ComponentFixture<EquipmentTypeDropdownComponent>;
  let component: EquipmentTypeDropdownComponent;
  let service: ReturnType<typeof makeService>;

  async function setup(types: EquipmentType[] = mockTypes) {
    service = makeService(types);

    await TestBed.configureTestingModule({
      imports: [EquipmentTypeDropdownComponent],
      providers: [{ provide: EquipmentTypeService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentTypeDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create and load types', async () => {
    await setup();
    expect(component).toBeTruthy();
    expect(service.getAll).toHaveBeenCalledOnce();
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
