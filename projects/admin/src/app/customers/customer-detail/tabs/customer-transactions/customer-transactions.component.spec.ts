import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerTransactionsComponent } from './customer-transactions.component';
import type { PageEvent } from '@angular/material/paginator';
import { CustomerTransactionsStore } from '../../customer-transactions.store';

const makeStore = () => ({
  load: vi.fn(),
  loadPage: vi.fn(),
  transactions: signal([]),
  totalItems: signal(0),
  pageIndex: signal(0),
  pageSize: signal(20),
  loading: signal(false),
});

describe('CustomerTransactionsComponent', () => {
  let fixture: ComponentFixture<CustomerTransactionsComponent>;
  let store: ReturnType<typeof makeStore>;

  beforeEach(async () => {
    store = makeStore();
    await TestBed.configureTestingModule({
      imports: [CustomerTransactionsComponent],
      providers: [
        { provide: CustomerTransactionsStore, useValue: store },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CustomerTransactionsComponent);
    fixture.detectChanges();
  });

  it('should call store.load() on init', () => {
    expect(store.load).toHaveBeenCalledOnce();
  });

  it('should render empty state when no transactions', () => {
    expect(fixture.nativeElement.textContent).toContain('No transactions');
  });

  it('should call store.loadPage on paginator page event', () => {
    (fixture.componentInstance as unknown as { onPage(e: PageEvent): void }).onPage({
      pageIndex: 1,
      pageSize: 20,
      length: 100,
    } as PageEvent);
    expect(store.loadPage).toHaveBeenCalledWith(1);
  });
});
