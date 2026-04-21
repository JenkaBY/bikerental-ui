import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { EquipmentTypeService, TariffService } from '../../../core/api';
import { Page, Tariff } from '@ui-models';
import { Labels } from '../../../shared/constant/labels';
import { TariffListComponent } from './tariff-list.component';
import { TariffDialogComponent } from './tariff-dialog.component';

const mockTariff: Tariff = {
  id: 1,
  name: 'Hourly Bike',
  equipmentType: 'bike',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 100 },
  validFrom: new Date('2026-01-01'),
  status: 'ACTIVE',
};

const mockInactiveTariff: Tariff = {
  id: 2,
  name: 'Daily Scooter',
  equipmentType: 'scooter',
  pricingType: 'DAILY',
  params: { dailyPrice: 50, overtimeHourlyPrice: 10 },
  validFrom: new Date('2026-01-01'),
  status: 'INACTIVE',
};

const mockPage: Page<Tariff> = { items: [mockTariff, mockInactiveTariff], totalItems: 2 };

function makeTariffService(page: Page<Tariff> = mockPage) {
  return {
    getAll: vi.fn().mockReturnValue(of(page)),
    activate: vi.fn().mockReturnValue(of({ ...mockInactiveTariff, status: 'ACTIVE' })),
    deactivate: vi.fn().mockReturnValue(of({ ...mockTariff, status: 'INACTIVE' })),
    getPricingTypes: vi.fn().mockReturnValue(of([])),
  };
}

function makeEquipmentTypeService() {
  return {
    getAll: vi.fn().mockReturnValue(of([{ slug: 'bike', name: 'Bicycle' }])),
  };
}

function makeDialog(afterClosed = new Subject<boolean | undefined>()) {
  const ref = { afterClosed: () => afterClosed } as unknown as MatDialogRef<unknown>;
  return { open: vi.fn().mockReturnValue(ref) };
}

function makeSnackBar() {
  return { open: vi.fn() };
}

describe('TariffListComponent', () => {
  let fixture: ComponentFixture<TariffListComponent>;
  let component: TariffListComponent;
  let tariffService: ReturnType<typeof makeTariffService>;
  let equipmentTypeService: ReturnType<typeof makeEquipmentTypeService>;
  let dialog: ReturnType<typeof makeDialog>;
  let snackBar: ReturnType<typeof makeSnackBar>;
  let dialogAfterClosed: Subject<boolean | undefined>;

  async function setup(page: Page<Tariff> = mockPage) {
    tariffService = makeTariffService(page);
    equipmentTypeService = makeEquipmentTypeService();
    dialogAfterClosed = new Subject();
    dialog = makeDialog(dialogAfterClosed);
    snackBar = makeSnackBar();

    await TestBed.configureTestingModule({
      imports: [TariffListComponent],
      providers: [
        { provide: TariffService, useValue: tariffService },
        { provide: EquipmentTypeService, useValue: equipmentTypeService },
        { provide: MatDialog, useValue: dialog },
        { provide: MatSnackBar, useValue: snackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TariffListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  // ─── Rendering ────────────────────────────────────────────────────────────

  it('creates the component', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('loads tariffs on init and populates items', async () => {
    await setup();
    expect(tariffService.getAll).toHaveBeenCalledOnce();
    expect(component.items()).toEqual(mockPage.items);
  });

  it('sets totalItems from page response', async () => {
    await setup();
    expect(component.totalItems()).toBe(mockPage.totalItems);
  });

  it('sets loading to false after data is loaded', async () => {
    await setup();
    expect(component.loading()).toBe(false);
  });

  it('renders a table row for each tariff', async () => {
    await setup();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(mockPage.items.length);
  });

  it('renders tariff name in the table', async () => {
    await setup();
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain(mockTariff.name);
  });

  it('resolves equipment type slug to name via cached service', async () => {
    await setup();
    expect(component.equipmentTypeNames()['bike']).toBe('Bicycle');
  });

  it('falls back to slug when equipment type name is not cached', async () => {
    await setup();
    expect(component.equipmentTypeNames()['scooter']).toBeUndefined();
  });

  it('sets pricingTypeTitles from Labels after getPricingTypes resolves', async () => {
    await setup();
    expect(component.pricingTypeTitles()['FLAT_HOURLY']).toBe(
      Labels.PricingTypeTitles['FLAT_HOURLY'],
    );
  });

  it('shows empty state message when items list is empty', async () => {
    await setup({ items: [], totalItems: 0 });
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('No tariffs found');
  });

  // ─── Pagination ───────────────────────────────────────────────────────────

  it('updates page signal and reloads when paginator fires page event', async () => {
    await setup();
    const callsBefore = tariffService.getAll.mock.calls.length;
    component.onPage({ pageIndex: 2, pageSize: 10, length: 20 });
    expect(component.page()).toBe(2);
    expect(tariffService.getAll.mock.calls.length).toBe(callsBefore + 1);
  });

  it('updates pageSize signal and reloads when page size changes', async () => {
    await setup();
    const callsBefore = tariffService.getAll.mock.calls.length;
    component.onPage({ pageIndex: 0, pageSize: 25, length: 20 });
    expect(component.pageSize()).toBe(25);
    expect(tariffService.getAll.mock.calls.length).toBe(callsBefore + 1);
  });

  // ─── Status toggle ────────────────────────────────────────────────────────

  it('calls deactivate when toggling an ACTIVE tariff', async () => {
    await setup();
    component.toggleStatus(mockTariff);
    expect(tariffService.deactivate).toHaveBeenCalledWith(mockTariff.id);
    expect(tariffService.activate).not.toHaveBeenCalled();
  });

  it('calls activate when toggling an INACTIVE tariff', async () => {
    await setup();
    component.toggleStatus(mockInactiveTariff);
    expect(tariffService.activate).toHaveBeenCalledWith(mockInactiveTariff.id);
    expect(tariffService.deactivate).not.toHaveBeenCalled();
  });

  it('updates the item in the list after successful deactivate', async () => {
    await setup();
    component.toggleStatus(mockTariff);
    const updated = component.items().find((t) => t.id === mockTariff.id);
    expect(updated?.status).toBe('INACTIVE');
  });

  it('updates the item in the list after successful activate', async () => {
    await setup();
    component.toggleStatus(mockInactiveTariff);
    const updated = component.items().find((t) => t.id === mockInactiveTariff.id);
    expect(updated?.status).toBe('ACTIVE');
  });

  it('shows snackbar after successful status toggle', async () => {
    await setup();
    component.toggleStatus(mockTariff);
    expect(snackBar.open).toHaveBeenCalled();
  });

  it('sets toggling to false after successful toggle', async () => {
    await setup();
    component.toggleStatus(mockTariff);
    expect(component.toggling()[mockTariff.id]).toBe(false);
  });

  it('shows error snackbar when toggle call fails', async () => {
    await setup();
    tariffService.deactivate.mockReturnValue(throwError(() => new Error('Server error')));
    component.toggleStatus(mockTariff);
    expect(snackBar.open).toHaveBeenCalledWith('Server error', Labels.Close, { duration: 4000 });
  });

  it('sets toggling to false after toggle error', async () => {
    await setup();
    tariffService.deactivate.mockReturnValue(throwError(() => new Error('fail')));
    component.toggleStatus(mockTariff);
    expect(component.toggling()[mockTariff.id]).toBe(false);
  });

  it('does nothing when toggleStatus is called with undefined id', async () => {
    await setup();
    const noId = { ...mockTariff, id: undefined as unknown as number };
    component.toggleStatus(noId);
    expect(tariffService.deactivate).not.toHaveBeenCalled();
    expect(tariffService.activate).not.toHaveBeenCalled();
  });

  // ─── Dialog wiring ────────────────────────────────────────────────────────

  it('opens TariffDialogComponent when openCreateDialog is called', async () => {
    await setup();
    component.openCreateDialog();
    expect(dialog.open).toHaveBeenCalledWith(
      TariffDialogComponent,
      expect.objectContaining({ width: '680px' }),
    );
  });

  it('passes empty data object in create mode', async () => {
    await setup();
    component.openCreateDialog();
    const config = dialog.open.mock.calls[0][1];
    expect(config).toMatchObject({ data: {} });
    expect(config.data.tariff).toBeUndefined();
  });

  it('opens TariffDialogComponent when openEditDialog is called', async () => {
    await setup();
    component.openEditDialog(mockTariff);
    expect(dialog.open).toHaveBeenCalledWith(
      TariffDialogComponent,
      expect.objectContaining({ width: '680px' }),
    );
  });

  it('passes tariff in dialog data in edit mode', async () => {
    await setup();
    component.openEditDialog(mockTariff);
    const config = dialog.open.mock.calls[0][1];
    expect(config).toMatchObject({ data: { tariff: mockTariff } });
  });

  it('reloads list and shows snackbar when create dialog closes with true', async () => {
    await setup();
    component.openCreateDialog();
    const callsBefore = tariffService.getAll.mock.calls.length;
    dialogAfterClosed.next(true);
    expect(tariffService.getAll.mock.calls.length).toBe(callsBefore + 1);
    expect(snackBar.open).toHaveBeenCalledWith(Labels.Saved, Labels.Close, { duration: 3000 });
  });

  it('reloads list and shows snackbar when edit dialog closes with true', async () => {
    await setup();
    component.openEditDialog(mockTariff);
    const callsBefore = tariffService.getAll.mock.calls.length;
    dialogAfterClosed.next(true);
    expect(tariffService.getAll.mock.calls.length).toBe(callsBefore + 1);
    expect(snackBar.open).toHaveBeenCalledWith(Labels.Saved, Labels.Close, { duration: 3000 });
  });

  it('does not reload when create dialog closes with undefined', async () => {
    await setup();
    component.openCreateDialog();
    const callsBefore = tariffService.getAll.mock.calls.length;
    dialogAfterClosed.next(undefined);
    expect(tariffService.getAll.mock.calls.length).toBe(callsBefore);
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('does not reload when edit dialog closes with false', async () => {
    await setup();
    component.openEditDialog(mockTariff);
    const callsBefore = tariffService.getAll.mock.calls.length;
    dialogAfterClosed.next(false);
    expect(tariffService.getAll.mock.calls.length).toBe(callsBefore);
    expect(snackBar.open).not.toHaveBeenCalled();
  });
});
