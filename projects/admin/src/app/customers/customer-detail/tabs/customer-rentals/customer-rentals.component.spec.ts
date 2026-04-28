import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerRentalsComponent } from './customer-rentals.component';
import { CustomerRentalsStore } from '../../customer-rentals.store';

const makeStore = () => ({
  load: vi.fn(),
  rentals: signal([]),
  expandedIds: signal(new Set<number>()),
  detailCache: signal(new Map()),
  loadingDetailIds: signal(new Set<number>()),
  listLoading: signal(false),
  isExpanded: vi.fn().mockReturnValue(false),
  toggleExpand: vi.fn(),
});

describe('CustomerRentalsComponent', () => {
  let fixture: ComponentFixture<CustomerRentalsComponent>;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [CustomerRentalsComponent],
      providers: [
        { provide: CustomerRentalsStore, useValue: store },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerRentalsComponent);
    fixture.detectChanges();
  });

  it('should call store.load() on init', () => {
    expect(store.load).toHaveBeenCalledOnce();
  });

  it('should render empty state when no rentals', () => {
    expect(fixture.nativeElement.textContent).toContain('No rentals');
  });
});
