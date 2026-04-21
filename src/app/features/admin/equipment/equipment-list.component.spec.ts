import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { EquipmentListComponent } from './equipment-list.component';
import { EquipmentService, EquipmentStatusService, EquipmentTypeService } from '../../../core/api';
import { MatDialog } from '@angular/material/dialog';
import { Page } from '@ui-models';
import { EquipmentResponse } from '@api-models';

describe('EquipmentListComponent', () => {
  let fixture: ComponentFixture<EquipmentListComponent>;
  let component: EquipmentListComponent;

  const makeEquipmentService = () =>
    ({
      search: vi.fn(),
    }) as unknown as EquipmentService;

  const makeTypeService = () =>
    ({
      getAll: vi.fn(),
    }) as unknown as EquipmentTypeService;

  const makeStatusService = () =>
    ({
      getAll: vi.fn(),
    }) as unknown as EquipmentStatusService;

  const makeDialog = () => ({ open: vi.fn() }) as unknown as MatDialog;

  // helper to avoid explicit `any` casts for spy instances in tests
  const asSpy = (fn: unknown) => fn as unknown as ReturnType<typeof vi.fn>;
  async function createComponentWithMocks(
    overrides?: Partial<{
      equipmentService: EquipmentService;
      typeService: EquipmentTypeService;
      statusService: EquipmentStatusService;
      dialog: MatDialog;
    }>,
  ) {
    const equipmentService = overrides?.equipmentService ?? makeEquipmentService();
    const typeService = overrides?.typeService ?? makeTypeService();
    const statusService = overrides?.statusService ?? makeStatusService();
    const dialog = overrides?.dialog ?? makeDialog();

    const userProvidedEquipment = !!overrides?.equipmentService;
    const userProvidedType = !!overrides?.typeService;
    const userProvidedStatus = !!overrides?.statusService;
    const userProvidedDialog = !!overrides?.dialog;

    // lightweight typed views to avoid `as any` and still allow runtime modifications
    const es = equipmentService as unknown as { search?: unknown };
    const tsrv = typeService as unknown as { getAll?: unknown };
    const ssrv = statusService as unknown as { getAll?: unknown };
    const dlg = dialog as unknown as { open?: unknown };

    // ensure default mocks return observables so component init can subscribe
    if (!userProvidedEquipment) {
      if (typeof es.search === 'function') {
        try {
          // if it's a spy, set its return value
          asSpy(es.search).mockReturnValue(of({ items: [], totalItems: 0 }));
        } catch {
          // not a spy - replace with a spy that returns an observable
          es.search = vi.fn(() => of({ items: [], totalItems: 0 }));
        }
      } else {
        es.search = vi.fn(() => of({ items: [], totalItems: 0 }));
      }
    }

    if (!userProvidedType) {
      if (typeof tsrv.getAll === 'function') {
        try {
          asSpy(tsrv.getAll).mockReturnValue(of([]));
        } catch {
          tsrv.getAll = vi.fn(() => of([]));
        }
      } else {
        tsrv.getAll = vi.fn(() => of([]));
      }
    }

    if (!userProvidedStatus) {
      if (typeof ssrv.getAll === 'function') {
        try {
          asSpy(ssrv.getAll).mockReturnValue(of([]));
        } catch {
          ssrv.getAll = vi.fn(() => of([]));
        }
      } else {
        ssrv.getAll = vi.fn(() => of([]));
      }
    }

    // ensure dialog.open exists
    if (!userProvidedDialog) {
      dlg.open = dlg.open ?? vi.fn();
    }

    await TestBed.configureTestingModule({
      imports: [EquipmentListComponent],
      providers: [
        { provide: EquipmentService, useValue: equipmentService },
        { provide: EquipmentTypeService, useValue: typeService },
        { provide: EquipmentStatusService, useValue: statusService },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentListComponent);
    component = fixture.componentInstance;

    return { equipmentService, typeService, statusService, dialog };
  }

  it('should load types, statuses and equipment on init', async () => {
    const sampleTypes = [{ slug: 'bike', name: 'Bike' }];
    const sampleStatuses = [{ slug: 'available', name: 'Available' }];
    const samplePage: Page<EquipmentResponse> = {
      items: [{ id: 1, uid: '1', serialNumber: 'SN', type: 's', status: 'RENTED', model: '' }],
      totalItems: 1,
    };

    const equipmentService = makeEquipmentService();
    asSpy(equipmentService.search).mockReturnValue(of(samplePage));

    const typeService = makeTypeService();
    asSpy(typeService.getAll).mockReturnValue(of(sampleTypes));

    const statusService = makeStatusService();
    asSpy(statusService.getAll).mockReturnValue(of(sampleStatuses));

    await createComponentWithMocks({ equipmentService, typeService, statusService });

    fixture.detectChanges();

    // after init (ngOnInit) the signals should be populated
    expect(component.types().length).toBe(1);
    expect(component.statuses().length).toBe(1);
    expect(component.equipment().length).toBe(1);
    expect(component.totalItems()).toBe(1);
    expect(component.loading()).toBe(false);

    // verify search was called with default pageable (page 0, size 20)
    const initCalls = asSpy(equipmentService.search).mock.calls;
    expect(initCalls.length).toBeGreaterThan(0);
    const lastInitArgs = initCalls[initCalls.length - 1];
    expect(lastInitArgs[0]).toBeUndefined();
    expect(lastInitArgs[1]).toBeUndefined();
    expect(lastInitArgs[2]).toBeDefined();
    expect(lastInitArgs[2].page).toBe(0);
    expect(lastInitArgs[2].size).toBe(20);
  });

  it('should set filter and reload equipment on status filter change', async () => {
    const equipmentService = makeEquipmentService();
    asSpy(equipmentService.search).mockReturnValue(of({ items: [], totalItems: 0 }));

    await createComponentWithMocks({ equipmentService });

    fixture.detectChanges();

    // set a non-empty filter
    component.onFilterStatusChange('available');

    expect(component.filterStatus()).toBe('available');
    expect(component.pageIndex()).toBe(0);
    expect(asSpy(equipmentService.search)).toHaveBeenCalled();
  });

  it('should set filter and reload equipment on type filter change', async () => {
    const equipmentService = makeEquipmentService();
    asSpy(equipmentService.search).mockReturnValue(of({ items: [], totalItems: 0 }));

    await createComponentWithMocks({ equipmentService });

    fixture.detectChanges();

    component.onFilterTypeChange('bike');

    expect(component.filterType()).toBe('bike');
    expect(component.pageIndex()).toBe(0);
    expect(asSpy(equipmentService.search)).toHaveBeenCalled();
  });

  it('should update pageIndex/pageSize and reload equipment on page change', async () => {
    const equipmentService = makeEquipmentService();
    asSpy(equipmentService.search).mockReturnValue(of({ items: [], totalItems: 0 }));

    await createComponentWithMocks({ equipmentService });

    fixture.detectChanges();

    const pageEvent = { pageIndex: 1, pageSize: 20, length: 100 } as unknown as {
      pageIndex: number;
      pageSize: number;
      length: number;
    };
    component.onPageChange(pageEvent);

    expect(component.pageIndex()).toBe(1);
    expect(component.pageSize()).toBe(20);
    // verify last search call included the expected pageable
    const calls = asSpy(equipmentService.search).mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const last = calls[calls.length - 1];
    expect(last[2]).toBeDefined();
    expect(last[2].page).toBe(1);
    expect(last[2].size).toBe(20);
  });

  it('should open create dialog and reload when dialog closed with true', async () => {
    const equipmentService = makeEquipmentService();
    asSpy(equipmentService.search).mockReturnValue(of({ items: [], totalItems: 0 }));

    const afterClosed = of(true);
    const dialogRef = { afterClosed: () => afterClosed };
    const dialog = makeDialog();
    dialog.open = vi.fn().mockReturnValue(dialogRef);

    await createComponentWithMocks({ equipmentService, dialog });

    fixture.detectChanges();

    // initial load called at least once during init
    const initialCalls = asSpy(equipmentService.search).mock.calls.length;

    component.openCreateDialog();

    // afterClosed returned true -> should trigger another load (calls increased by 1)
    expect(asSpy(equipmentService.search).mock.calls.length).toBe(initialCalls + 1);
    expect(dialog.open).toHaveBeenCalled();
  });

  it('should open edit dialog and reload when dialog closed with true', async () => {
    const equipmentService = makeEquipmentService();
    asSpy(equipmentService.search).mockReturnValue(of({ items: [], totalItems: 0 }));

    const afterClosed = of(true);
    const dialogRef = { afterClosed: () => afterClosed };
    const dialog = makeDialog();
    dialog.open = vi.fn().mockReturnValue(dialogRef);

    await createComponentWithMocks({ equipmentService, dialog });

    fixture.detectChanges();

    const sample: EquipmentResponse = {
      id: 1,
      uid: '1',
      serialNumber: 'S1',
      type: 's',
      status: 'RENTED',
      model: '',
    };

    // initial load may have occurred multiple times depending on environment
    const initialCallsEdit = asSpy(equipmentService.search).mock.calls.length;

    component.openEditDialog(sample);

    expect(dialog.open).toHaveBeenCalled();
    expect(asSpy(equipmentService.search).mock.calls.length).toBe(initialCallsEdit + 1);
  });

  it('should set loading false when search errors', async () => {
    const equipmentService = makeEquipmentService();
    asSpy(equipmentService.search).mockReturnValue(throwError(() => new Error('fail')));

    await createComponentWithMocks({ equipmentService });

    fixture.detectChanges();

    // even on error loading should be false after observable error handler runs
    expect(component.loading()).toBe(false);
  });
});
