import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { EquipmentStatusStore } from '../../../core/state/equipment-status.store';
import { EquipmentStatus } from '@ui-models';
import { EquipmentStatusListComponent } from './equipment-status-list.component';

const mockStatuses: EquipmentStatus[] = [
  { slug: 'available', name: 'Available', allowedTransitions: ['rented'] },
  { slug: 'rented', name: 'Rented', allowedTransitions: ['available', 'maintenance'] },
  { slug: 'maintenance', name: 'Maintenance', allowedTransitions: [] },
];

function makeStore(statuses: EquipmentStatus[] = mockStatuses, loading = false) {
  return {
    statuses: () => statuses,
    loading: () => loading,
    load: vi.fn().mockReturnValue(of(undefined)),
  };
}

function makeDialog() {
  return { open: vi.fn() };
}

describe('EquipmentStatusListComponent', () => {
  let fixture: ComponentFixture<EquipmentStatusListComponent>;
  let component: EquipmentStatusListComponent;
  let store: ReturnType<typeof makeStore>;
  let dialog: ReturnType<typeof makeDialog>;

  async function setup(statuses: EquipmentStatus[] = mockStatuses) {
    store = makeStore(statuses);
    dialog = makeDialog();

    await TestBed.configureTestingModule({
      imports: [EquipmentStatusListComponent],
      providers: [
        { provide: EquipmentStatusStore, useValue: store },
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

  it('should render table rows for each status', async () => {
    await setup();
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('tr[mat-row]');
    expect(rows.length).toBe(mockStatuses.length);
  });

  it('should show progress bar when loading', async () => {
    store = makeStore(mockStatuses, true);
    dialog = makeDialog();
    await TestBed.configureTestingModule({
      imports: [EquipmentStatusListComponent],
      providers: [
        { provide: EquipmentStatusStore, useValue: store },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(EquipmentStatusListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeTruthy();
  });

  it('should hide progress bar when not loading', async () => {
    await setup();
    expect(fixture.nativeElement.querySelector('mat-progress-bar')).toBeNull();
  });

  it('should open create dialog with statuses list and no status entry', async () => {
    await setup();
    component.openCreateDialog();
    expect(dialog.open).toHaveBeenCalledOnce();
    const callArgs = dialog.open.mock.calls[0];
    expect(callArgs[1]).toMatchObject({ data: { statuses: store.statuses() } });
    expect(callArgs[1].data.status).toBeUndefined();
  });

  it('should open edit dialog with status and statuses list', async () => {
    await setup();
    component.openEditDialog(mockStatuses[0]);
    expect(dialog.open).toHaveBeenCalledOnce();
    const callArgs = dialog.open.mock.calls[0];
    expect(callArgs[1]).toMatchObject({
      data: { status: mockStatuses[0], statuses: store.statuses() },
    });
  });
});
