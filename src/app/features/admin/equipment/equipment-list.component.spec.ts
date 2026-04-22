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

  it('should set filter and reload equipment on status filter change', async () => {
    const store = makeStore();

    await createComponentWithMocks({ store });
    fixture.detectChanges();

    component.onFilterStatusChange('available');

    expect(store.setFilterStatus as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(
      'available',
    );
    expect(store.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1);
  });

  it('should set filter and reload equipment on type filter change', async () => {
    const store = makeStore();

    await createComponentWithMocks({ store });
    fixture.detectChanges();

    component.onFilterTypeChange('bike');

    expect(store.setFilterType as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith('bike');
    expect(store.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1);
  });

  it('should update page and reload equipment on page change', async () => {
    const store = makeStore();

    await createComponentWithMocks({ store });
    fixture.detectChanges();

    component.onPageChange({ pageIndex: 1, pageSize: 20, length: 100 } as never);

    expect(store.setPage as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledWith(1, 20);
    expect(store.load as unknown as ReturnType<typeof vi.fn>).toHaveBeenCalledTimes(1);
  });
});
