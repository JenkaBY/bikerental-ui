import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, Subject, throwError } from 'rxjs';
import { EquipmentTypeService } from '../../../core/api';
import { EquipmentTypeResponse } from '../../../core/models';
import { EquipmentTypeListComponent } from './equipment-type-list.component';

const mockTypes: EquipmentTypeResponse[] = [
  { slug: 'bike', name: 'Bike', description: 'A bicycle' },
  { slug: 'scooter', name: 'Scooter' },
];

function makeService(types: EquipmentTypeResponse[] = mockTypes) {
  return { getAll: vi.fn().mockReturnValue(of(types)) };
}

function makeDialog(afterClosed = new Subject<boolean | undefined>()) {
  const ref = { afterClosed: () => afterClosed } as unknown as MatDialogRef<unknown>;
  return { open: vi.fn().mockReturnValue(ref) };
}

describe('EquipmentTypeListComponent', () => {
  let fixture: ComponentFixture<EquipmentTypeListComponent>;
  let component: EquipmentTypeListComponent;
  let service: ReturnType<typeof makeService>;
  let dialog: ReturnType<typeof makeDialog>;
  let dialogAfterClosed: Subject<boolean | undefined>;

  async function setup(types: EquipmentTypeResponse[] = mockTypes) {
    service = makeService(types);
    dialogAfterClosed = new Subject();
    dialog = makeDialog(dialogAfterClosed);

    await TestBed.configureTestingModule({
      imports: [EquipmentTypeListComponent],
      providers: [
        { provide: EquipmentTypeService, useValue: service },
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

  it('should load types on init', async () => {
    await setup();
    expect(service.getAll).toHaveBeenCalledOnce();
    expect(component.types()).toEqual(mockTypes);
  });

  it('should set loading false after load completes', async () => {
    await setup();
    expect(component.loading()).toBe(false);
  });

  it('should render table rows for each type', async () => {
    await setup();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(mockTypes.length);
  });

  it('should open dialog without data on create', async () => {
    await setup();
    component.openCreateDialog();
    expect(dialog.open).toHaveBeenCalled();
    const callArgs = dialog.open.mock.calls[0];
    // second arg is MatDialogConfig — ensure data is empty for create
    expect(callArgs[1]).toMatchObject({ data: {} });
  });

  it('should open dialog with type data on edit', async () => {
    await setup();
    component.openEditDialog(mockTypes[0]);
    expect(dialog.open).toHaveBeenCalledOnce();
    const callArgs = dialog.open.mock.calls[0];
    expect(callArgs[1]).toMatchObject({ data: { type: mockTypes[0] } });
  });

  it('should reload types when dialog closes with true', async () => {
    await setup();
    component.openCreateDialog();
    service.getAll.mockReturnValue(of(mockTypes));
    dialogAfterClosed.next(true);
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });

  it('should not reload types when dialog closes with undefined', async () => {
    await setup();
    component.openCreateDialog();
    dialogAfterClosed.next(undefined);
    expect(service.getAll).toHaveBeenCalledOnce();
  });

  it('should sort types by slug ascending', async () => {
    const unsorted: EquipmentTypeResponse[] = [
      { slug: 'scooter', name: 'Scooter' },
      { slug: 'bike', name: 'Bike' },
      { slug: 'moped', name: 'Moped' },
    ];
    await setup(unsorted);
    expect(component.types().map((t) => t.slug)).toEqual(['bike', 'moped', 'scooter']);
  });

  it('should set loading false and keep empty types on error', async () => {
    service = { getAll: vi.fn().mockReturnValue(throwError(() => new Error('Network error'))) };
    dialogAfterClosed = new Subject();
    dialog = makeDialog(dialogAfterClosed);

    await TestBed.configureTestingModule({
      imports: [EquipmentTypeListComponent],
      providers: [
        { provide: EquipmentTypeService, useValue: service },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentTypeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.types()).toEqual([]);
  });
});
