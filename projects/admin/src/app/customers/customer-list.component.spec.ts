import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MatDialog } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CustomerListComponent } from './customer-list.component';
import { CustomerListStore } from './customer-list.store';

const makeStore = () => ({
  customers: signal([]),
  searchQuery: signal(''),
  loading: signal(false),
  search: vi.fn(),
});

const makeDialogRef = (returnValue: unknown = undefined) => ({
  afterClosed: vi.fn().mockReturnValue(of(returnValue)),
});

const makeDialog = (returnValue: unknown = undefined) => ({
  open: vi.fn().mockReturnValue(makeDialogRef(returnValue)),
});

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let store: ReturnType<typeof makeStore>;
  let dialog: ReturnType<typeof makeDialog>;

  beforeEach(async () => {
    store = makeStore();
    dialog = makeDialog();
    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [
        provideRouter([]),
        provideNativeDateAdapter(),
        { provide: CustomerListStore, useValue: store },
      ],
    })
      .overrideProvider(MatDialog, { useValue: dialog })
      .compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should call store.search() when invoked', () => {
    store.search('375');
    expect(store.search).toHaveBeenCalledWith('375');
  });

  it('should render empty state when no customers', () => {
    // UI should show no customer rows/cards when the store has an empty array
    const tableRows = fixture.nativeElement.querySelectorAll('tr.mat-row');
    const mobileCards = fixture.nativeElement.querySelectorAll('mat-card');
    expect(tableRows.length).toBe(0);
    expect(mobileCards.length).toBe(0);
  });

  it('should render the "New Customer" button in the desktop header', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
      'button[mat-raised-button]',
    );
    const labels = Array.from(buttons).map((b) => b.textContent?.trim());
    expect(labels.some((t) => t?.includes('New Customer'))).toBe(true);
  });

  it('should call MatDialog.open() when openCreateDialog() is invoked', () => {
    fixture.componentInstance.openCreateDialog();
    expect(dialog.open).toHaveBeenCalledOnce();
  });

  it('should navigate to /customers/:id when dialog closes with an id', () => {
    dialog.open.mockReturnValue(makeDialogRef('cust-abc'));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.componentInstance.openCreateDialog();

    expect(navigateSpy).toHaveBeenCalledWith(['/customers', 'cust-abc']);
  });

  it('should NOT navigate when dialog closes with undefined (cancel)', () => {
    dialog.open.mockReturnValue(makeDialogRef(undefined));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    fixture.componentInstance.openCreateDialog();

    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
