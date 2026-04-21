import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { EquipmentListComponent } from './equipment-list.component';
import { MatDialog } from '@angular/material/dialog';
import { Equipment, EquipmentStatus, EquipmentType } from '@ui-models';
import { EquipmentStore } from '@store.equipment.store';
import { EquipmentTypeStore } from '@store.equipment-type.store';
import { EquipmentStatusStore } from '@store.equipment-status.store';

describe('EquipmentListComponent', () => {
  let fixture: ComponentFixture<EquipmentListComponent>;
  let component: EquipmentListComponent;

  const makeStore = () =>
    ({
      items: vi.fn(() => [] as Equipment[]),
      totalItems: vi.fn(() => 0),
      loading: vi.fn(() => false),
      filterStatus: vi.fn(() => undefined as string | undefined),
      filterType: vi.fn(() => undefined as string | undefined),
      pageIndex: vi.fn(() => 0),
      pageSize: vi.fn(() => 20),
      load: vi.fn(() => of(undefined)),
      setFilterStatus: vi.fn(),
      setFilterType: vi.fn(),
      setPage: vi.fn(),
    }) as unknown as EquipmentStore;

  const makeTypeStore = () =>
    ({
      types: vi.fn(() => [] as EquipmentType[]),
      typesForEquipment: vi.fn(() => [] as EquipmentType[]),
      load: vi.fn(() => of(undefined)),
    }) as unknown as EquipmentTypeStore;

  const makeStatusStore = () =>
    ({
      statuses: vi.fn(() => [] as EquipmentStatus[]),
      load: vi.fn(() => of(undefined)),
    }) as unknown as EquipmentStatusStore;

  const makeDialog = () => ({ open: vi.fn() }) as unknown as MatDialog;

  async function createComponentWithMocks(
    overrides?: Partial<{
      store: EquipmentStore;
      typeStore: EquipmentTypeStore;
      statusStore: EquipmentStatusStore;
      dialog: MatDialog;
    }>,
  ) {
    const store = overrides?.store ?? makeStore();
    const typeStore = overrides?.typeStore ?? makeTypeStore();
    const statusStore = overrides?.statusStore ?? makeStatusStore();
    const dialog = overrides?.dialog ?? makeDialog();

    await TestBed.configureTestingModule({
      imports: [EquipmentListComponent],
      providers: [
        { provide: EquipmentStore, useValue: store },
        { provide: EquipmentTypeStore, useValue: typeStore },
        { provide: EquipmentStatusStore, useValue: statusStore },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentListComponent);
    component = fixture.componentInstance;

    return { store, typeStore, statusStore, dialog };
  }

  it('should load types, statuses and equipment on init', async () => {
    const sampleTypes = [{ slug: 'bike', name: 'Bike', isForSpecialTariff: false }];
    const sampleStatuses = [{ slug: 'available', name: 'Available', allowedTransitions: [] }];
    const sampleEquipment = [
      {
        id: 1,
        uid: '1',
        serialNumber: 'SN',
        type: { slug: 'bike', name: 'Bike', isForSpecialTariff: false },
        status: { slug: 'available', name: 'Available', allowedTransitions: [] },
        model: '',
      },
    ] as Equipment[];

    const store = makeStore();
    (store.items as unknown as ReturnType<typeof vi.fn>).mockReturnValue(sampleEquipment);
    (store.totalItems as unknown as ReturnType<typeof vi.fn>).mockReturnValue(1);

    const typeStore = makeTypeStore();
    (typeStore.types as unknown as ReturnType<typeof vi.fn>).mockReturnValue(sampleTypes);
    (typeStore.typesForEquipment as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
      sampleTypes,
    );

    const statusStore = makeStatusStore();
    (statusStore.statuses as unknown as ReturnType<typeof vi.fn>).mockReturnValue(sampleStatuses);

    await createComponentWithMocks({ store, typeStore, statusStore });

    fixture.detectChanges();

    expect(component.equipmentTypeStore.types().length).toBe(1);
    expect(component.equipmentStatusStore.statuses().length).toBe(1);
    expect(component.store.items().length).toBe(1);
    expect(component.store.totalItems()).toBe(1);
    expect(component.store.loading()).toBe(false);
    expect(store.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    expect(typeStore.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
    expect(statusStore.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalled();
  });

  it('should set filter and reload equipment on status filter change', async () => {
    const store = makeStore();

    await createComponentWithMocks({ store });
    fixture.detectChanges();

    component.onFilterStatusChange('available');

    expect(store.setFilterStatus as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      'available',
    );
    expect(store.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(2);
  });

  it('should set filter and reload equipment on type filter change', async () => {
    const store = makeStore();

    await createComponentWithMocks({ store });
    fixture.detectChanges();

    component.onFilterTypeChange('bike');

    expect(store.setFilterType as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('bike');
    expect(store.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(2);
  });

  it('should update page and reload equipment on page change', async () => {
    const store = makeStore();

    await createComponentWithMocks({ store });
    fixture.detectChanges();

    component.onPageChange({ pageIndex: 1, pageSize: 20, length: 100 } as never);

    expect(store.setPage as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(1, 20);
    expect(store.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(2);
  });

  it('should open create dialog and reload when dialog closed with true', async () => {
    const store = makeStore();
    const dialog = makeDialog();
    (dialog.open as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      afterClosed: () => of(true),
    });

    await createComponentWithMocks({ store, dialog });
    fixture.detectChanges();

    component.openCreateDialog();

    expect(dialog.open).toHaveBeenCalled();
    expect(store.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(2);
  });

  it('should open edit dialog and reload when dialog closed with true', async () => {
    const store = makeStore();
    const dialog = makeDialog();
    (dialog.open as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      afterClosed: () => of(true),
    });

    await createComponentWithMocks({ store, dialog });
    fixture.detectChanges();

    component.openEditDialog({
      id: 1,
      uid: '1',
      serialNumber: 'S1',
      type: { slug: 'bike', name: 'Bike', isForSpecialTariff: false },
      status: { slug: 'available', name: 'Available', allowedTransitions: [] },
      model: '',
    } as Equipment);

    expect(dialog.open).toHaveBeenCalled();
    expect(store.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(2);
  });
});
