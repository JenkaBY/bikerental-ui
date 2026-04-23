import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { EquipmentTypeStore } from '@bikerental/shared';
import { EquipmentType } from '@ui-models';
import { EquipmentTypeListComponent } from './equipment-type-list.component';

const mockTypes: EquipmentType[] = [
  { slug: 'bike', name: 'Bike', description: 'A bicycle', isForSpecialTariff: false },
  { slug: 'scooter', name: 'Scooter', isForSpecialTariff: false },
];

function makeStore(types: EquipmentType[] = mockTypes, loading = false) {
  return {
    types: () => types,
    loading: () => loading,
    load: vi.fn().mockReturnValue(of(undefined)),
  };
}

function makeDialog() {
  return { open: vi.fn() };
}

describe('EquipmentTypeListComponent', () => {
  let fixture: ComponentFixture<EquipmentTypeListComponent>;
  let component: EquipmentTypeListComponent;
  let store: ReturnType<typeof makeStore>;
  let dialog: ReturnType<typeof makeDialog>;

  async function setup(types: EquipmentType[] = mockTypes) {
    store = makeStore(types);
    dialog = makeDialog();

    await TestBed.configureTestingModule({
      imports: [EquipmentTypeListComponent],
      providers: [
        { provide: EquipmentTypeStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentTypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should render table rows for each type', async () => {
    await setup();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(mockTypes.length);
  });

  it('should show progress bar when loading', async () => {
    store = makeStore(mockTypes, true);
    dialog = makeDialog();
    await TestBed.configureTestingModule({
      imports: [EquipmentTypeListComponent],
      providers: [
        { provide: EquipmentTypeStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EquipmentTypeListComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeTruthy();
  });

  it('should hide progress bar when not loading', async () => {
    await setup();
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeNull();
  });

  it('should open create dialog with empty data', async () => {
    await setup();
    component.openCreateDialog();
    expect(dialog.open).toHaveBeenCalledOnce();
    const callArgs = dialog.open.mock.calls[0];
    expect(callArgs[1]).toMatchObject({ data: {} });
  });

  it('should open edit dialog with type data', async () => {
    await setup();
    component.openEditDialog(mockTypes[0]);
    expect(dialog.open).toHaveBeenCalledOnce();
    const callArgs = dialog.open.mock.calls[0];
    expect(callArgs[1]).toMatchObject({ data: { type: mockTypes[0] } });
  });
});
