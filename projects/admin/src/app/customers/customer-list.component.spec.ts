import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerListComponent } from './customer-list.component';
import { CustomerListStore } from './customer-list.store';

const makeStore = () => ({
  customers: signal([]),
  searchQuery: signal(''),
  loading: signal(false),
  search: vi.fn(),
});

describe('CustomerListComponent', () => {
  let fixture: ComponentFixture<CustomerListComponent>;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [provideRouter([]), { provide: CustomerListStore, useValue: store }],
    }).compileComponents();

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
});
