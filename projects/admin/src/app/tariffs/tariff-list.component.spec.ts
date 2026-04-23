import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, Subject, throwError } from 'rxjs';
import { Tariff, TariffStatus } from '@ui-models';
import { TariffStore } from '@store.tariff.store';
import { Labels } from '@bikerental/shared';
import { TariffListComponent } from './tariff-list.component';
import { TariffDialogComponent } from './tariff-dialog.component';

function withTariffFlags(base: Omit<Tariff, 'isActive' | 'isSpecial'>): Tariff {
  return {
    ...base,
    isActive: base.status === TariffStatus.ACTIVE,
    isSpecial: base.pricingType.slug === 'SPECIAL',
  };
}

const bicycleType = {
  slug: 'bike',
  name: 'Bicycle',
  isForSpecialTariff: false,
};

const scooterType = {
  slug: 'scooter',
  name: 'Scooter',
  isForSpecialTariff: false,
};

const mockTariff: Tariff = withTariffFlags({
  id: 1,
  name: 'Hourly Bike',
  equipmentType: bicycleType,
  pricingType: {
    slug: 'FLAT_HOURLY',
    title: 'Flat hourly',
    description: 'Flat hourly rate',
  },
  params: { hourlyPrice: 100 },
  validFrom: new Date('2026-01-01'),
  status: TariffStatus.ACTIVE,
});

const mockInactiveTariff: Tariff = withTariffFlags({
  id: 2,
  name: 'Daily Scooter',
  equipmentType: scooterType,
  pricingType: {
    slug: 'DAILY',
    title: 'Daily',
    description: 'Daily pricing',
  },
  params: { dailyPrice: 50, overtimeHourlyPrice: 10 },
  validFrom: new Date('2026-01-01'),
  status: TariffStatus.INACTIVE,
});

function makeTariffStore(
  initialItems: Tariff[] = [mockTariff, mockInactiveTariff],
  totalItems = 2,
) {
  const tariffs = signal<Tariff[]>(initialItems);
  const loading = signal(false);
  const currentPage = signal(0);
  const pageSize = signal(10);
  const total = signal(totalItems);

  return {
    tariffs,
    loading,
    currentPage,
    pageSize,
    totalItems: total,
    load: vi.fn().mockReturnValue(of(void 0)),
    setPage: vi.fn().mockImplementation((page: number, size: number) => {
      currentPage.set(page);
      pageSize.set(size);
    }),
    activate: vi.fn().mockImplementation((id: number) => {
      const updated = withTariffFlags({ ...mockInactiveTariff, id, status: TariffStatus.ACTIVE });
      tariffs.update((items) => items.map((item) => (item.id === id ? updated : item)));
      return of(updated);
    }),
    deactivate: vi.fn().mockImplementation((id: number) => {
      const updated = withTariffFlags({ ...mockTariff, id, status: TariffStatus.INACTIVE });
      tariffs.update((items) => items.map((item) => (item.id === id ? updated : item)));
      return of(updated);
    }),
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
  let tariffStore: ReturnType<typeof makeTariffStore>;
  let dialog: ReturnType<typeof makeDialog>;
  let snackBar: ReturnType<typeof makeSnackBar>;
  let dialogAfterClosed: Subject<boolean | undefined>;

  async function setup(items: Tariff[] = [mockTariff, mockInactiveTariff], totalItems = 2) {
    tariffStore = makeTariffStore(items, totalItems);
    dialogAfterClosed = new Subject();
    dialog = makeDialog(dialogAfterClosed);
    snackBar = makeSnackBar();

    await TestBed.configureTestingModule({
      imports: [TariffListComponent],
      providers: [
        { provide: TariffStore, useValue: tariffStore },
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
    expect(tariffStore.load).toHaveBeenCalledOnce();
    expect(component.items()).toEqual([mockTariff, mockInactiveTariff]);
  });

  it('sets totalItems from page response', async () => {
    await setup();
    expect(component.totalItems()).toBe(2);
  });

  it('sets loading to false after data is loaded', async () => {
    await setup();
    expect(component.loading()).toBe(false);
  });

  it('renders a table row for each tariff', async () => {
    await setup();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(2);
  });

  it('renders tariff name in the table', async () => {
    await setup();
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain(mockTariff.name);
  });

  it('renders the mapped equipment type name from the store item', async () => {
    await setup();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(bicycleType.name);
  });

  it('shows empty state message when items list is empty', async () => {
    await setup([], 0);
    fixture.detectChanges();
    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('No tariffs found');
  });

  // ─── Pagination ───────────────────────────────────────────────────────────

  it('updates page signal and reloads when paginator fires page event', async () => {
    await setup();
    component.onPage({ pageIndex: 2, pageSize: 10, length: 20 });
    expect(tariffStore.setPage).toHaveBeenCalledWith(2, 10);
    expect(component.page()).toBe(2);
  });

  it('updates pageSize signal when page size changes', async () => {
    await setup();
    component.onPage({ pageIndex: 0, pageSize: 25, length: 20 });
    expect(tariffStore.setPage).toHaveBeenCalledWith(0, 25);
    expect(component.pageSize()).toBe(25);
  });

  // ─── Status toggle ────────────────────────────────────────────────────────

  it('calls deactivate when toggling an ACTIVE tariff', async () => {
    await setup();
    component.toggleStatus(mockTariff);
    expect(tariffStore.deactivate).toHaveBeenCalledWith(mockTariff.id);
    expect(tariffStore.activate).not.toHaveBeenCalled();
  });

  it('calls activate when toggling an INACTIVE tariff', async () => {
    await setup();
    component.toggleStatus(mockInactiveTariff);
    expect(tariffStore.activate).toHaveBeenCalledWith(mockInactiveTariff.id);
    expect(tariffStore.deactivate).not.toHaveBeenCalled();
  });

  it('updates the item in the list after successful deactivate', async () => {
    await setup();
    component.toggleStatus(mockTariff);
    const updated = component.items().find((t) => t.id === mockTariff.id);
    expect(updated?.status).toBe(TariffStatus.INACTIVE);
  });

  it('updates the item in the list after successful activate', async () => {
    await setup();
    component.toggleStatus(mockInactiveTariff);
    const updated = component.items().find((t) => t.id === mockInactiveTariff.id);
    expect(updated?.status).toBe(TariffStatus.ACTIVE);
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
    tariffStore.deactivate.mockReturnValue(throwError(() => new Error('Server error')));
    component.toggleStatus(mockTariff);
    expect(snackBar.open).toHaveBeenCalledWith('Server error', Labels.Close, { duration: 4000 });
  });

  it('sets toggling to false after toggle error', async () => {
    await setup();
    tariffStore.deactivate.mockReturnValue(throwError(() => new Error('fail')));
    component.toggleStatus(mockTariff);
    expect(component.toggling()[mockTariff.id]).toBe(false);
  });

  it('does nothing when toggleStatus is called with undefined id', async () => {
    await setup();
    const noId = { ...mockTariff, id: undefined as unknown as number };
    component.toggleStatus(noId);
    expect(tariffStore.deactivate).not.toHaveBeenCalled();
    expect(tariffStore.activate).not.toHaveBeenCalled();
  });

  // ─── Dialog wiring ───────────────────────────────────────────────────────

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

  it('shows snackbar when create dialog closes with true', async () => {
    await setup();
    component.openCreateDialog();
    const callsBefore = tariffStore.load.mock.calls.length;
    dialogAfterClosed.next(true);
    expect(tariffStore.load.mock.calls.length).toBe(callsBefore);
    expect(snackBar.open).toHaveBeenCalledWith(Labels.Saved, Labels.Close, { duration: 3000 });
  });

  it('shows snackbar when edit dialog closes with true', async () => {
    await setup();
    component.openEditDialog(mockTariff);
    const callsBefore = tariffStore.load.mock.calls.length;
    dialogAfterClosed.next(true);
    expect(tariffStore.load.mock.calls.length).toBe(callsBefore);
    expect(snackBar.open).toHaveBeenCalledWith(Labels.Saved, Labels.Close, { duration: 3000 });
  });

  it('does not reload when create dialog closes with undefined', async () => {
    await setup();
    component.openCreateDialog();
    const callsBefore = tariffStore.load.mock.calls.length;
    dialogAfterClosed.next(undefined);
    expect(tariffStore.load.mock.calls.length).toBe(callsBefore);
    expect(snackBar.open).not.toHaveBeenCalled();
  });

  it('does not reload when edit dialog closes with false', async () => {
    await setup();
    component.openEditDialog(mockTariff);
    const callsBefore = tariffStore.load.mock.calls.length;
    dialogAfterClosed.next(false);
    expect(tariffStore.load.mock.calls.length).toBe(callsBefore);
    expect(snackBar.open).not.toHaveBeenCalled();
  });
});
