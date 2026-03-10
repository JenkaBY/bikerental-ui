import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { EquipmentStatusService } from '../../../core/api';
import { EquipmentStatusResponse } from '../../../core/models';
import { EquipmentStatusListComponent } from './equipment-status-list.component';

const mockStatuses: EquipmentStatusResponse[] = [
  { slug: 'available', name: 'Available', allowedTransitions: ['rented'] },
  { slug: 'rented', name: 'Rented', allowedTransitions: ['available', 'maintenance'] },
  { slug: 'maintenance', name: 'Maintenance' },
];

function makeService(statuses: EquipmentStatusResponse[] = mockStatuses) {
  return { getAll: vi.fn().mockReturnValue(of(statuses)) };
}

function makeDialog(afterClosed = new Subject<boolean | undefined>()) {
  const ref = { afterClosed: () => afterClosed } as unknown as MatDialogRef<unknown>;
  return { open: vi.fn().mockReturnValue(ref) };
}

describe('EquipmentStatusListComponent', () => {
  let fixture: ComponentFixture<EquipmentStatusListComponent>;
  let component: EquipmentStatusListComponent;
  let service: ReturnType<typeof makeService>;
  let dialog: ReturnType<typeof makeDialog>;
  let dialogAfterClosed: Subject<boolean | undefined>;

  async function setup(statuses: EquipmentStatusResponse[] = mockStatuses) {
    service = makeService(statuses);
    dialogAfterClosed = new Subject();
    dialog = makeDialog(dialogAfterClosed);

    await TestBed.configureTestingModule({
      imports: [EquipmentStatusListComponent],
      providers: [
        { provide: EquipmentStatusService, useValue: service },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentStatusListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should load statuses on init', async () => {
    await setup();
    expect(service.getAll).toHaveBeenCalledOnce();
    expect(component.statuses()).toHaveLength(mockStatuses.length);
  });

  it('should set loading false after load completes', async () => {
    await setup();
    expect(component.loading()).toBe(false);
  });

  it('should render table rows for each status', async () => {
    await setup();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(mockStatuses.length);
  });

  it('should open create dialog with statuses list and no status entry', async () => {
    await setup();
    component.openCreateDialog();
    expect(dialog.open).toHaveBeenCalled();
    const callArgs = dialog.open.mock.calls[0];
    expect(callArgs[1]).toMatchObject({ data: { statuses: component.statuses() } });
    expect(callArgs[1].data.status).toBeUndefined();
  });

  it('should open edit dialog with status and statuses list', async () => {
    await setup();
    component.openEditDialog(mockStatuses[0]);
    expect(dialog.open).toHaveBeenCalledOnce();
    const callArgs = dialog.open.mock.calls[0];
    expect(callArgs[1]).toMatchObject({
      data: { status: mockStatuses[0], statuses: component.statuses() },
    });
  });

  it('should reload statuses when dialog closes with true', async () => {
    await setup();
    component.openCreateDialog();
    service.getAll.mockReturnValue(of(mockStatuses));
    dialogAfterClosed.next(true);
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('should not reload statuses when dialog closes with undefined', async () => {
    await setup();
    component.openCreateDialog();
    dialogAfterClosed.next(undefined);
    expect(service.getAll).toHaveBeenCalledOnce();
  });

  it('should sort statuses by slug ascending', async () => {
    const unsorted: EquipmentStatusResponse[] = [
      { slug: 'rented', name: 'Rented' },
      { slug: 'available', name: 'Available' },
      { slug: 'maintenance', name: 'Maintenance' },
    ];
    await setup(unsorted);
    expect(component.statuses().map((s) => s.slug)).toEqual(['available', 'maintenance', 'rented']);
  });

  it('should set loading false and keep empty statuses on error', async () => {
    service = { getAll: vi.fn().mockReturnValue(throwError(() => new Error('Network error'))) };
    dialogAfterClosed = new Subject();
    dialog = makeDialog(dialogAfterClosed);

    await TestBed.configureTestingModule({
      imports: [EquipmentStatusListComponent],
      providers: [
        { provide: EquipmentStatusService, useValue: service },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentStatusListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.statuses()).toEqual([]);
  });
});
