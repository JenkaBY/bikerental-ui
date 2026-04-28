import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CustomerDetailComponent } from './customer-detail.component';
import { CustomerLayoutStore } from './customer-layout.store';
import { CustomerRentalsStore } from './customer-rentals.store';
import { CustomerTransactionsStore } from './customer-transactions.store';

const makeLayoutStore = () => ({
  load: vi.fn(),
  customer: signal({ id: '1', phone: '+375', firstName: 'Ivan', lastName: 'Ivanov' }),
  balance: signal(null),
  profileLoading: signal(false),
  balanceLoading: signal(false),
  balanceError: signal(false),
  customerId: signal('1'),
});

@Component({ template: '' })
class DummyComponent {}

describe('CustomerDetailComponent', () => {
  let fixture: ComponentFixture<CustomerDetailComponent>;
  let layoutStore: ReturnType<typeof makeLayoutStore>;

  beforeEach(async () => {
    layoutStore = makeLayoutStore();

    // Override the stores provided at component-level so the component receives our mocks
    TestBed.overrideProvider(CustomerLayoutStore, { useValue: layoutStore });
    TestBed.overrideProvider(CustomerRentalsStore, { useValue: {} });
    TestBed.overrideProvider(CustomerTransactionsStore, { useValue: {} });

    await TestBed.configureTestingModule({
      imports: [CustomerDetailComponent],
      providers: [
        // Provide ActivatedRoute snapshot with id to avoid navigation to /customers
        {
          provide: (await import('@angular/router')).ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => '1' } } },
        },
        provideRouter([
          { path: 'customers', loadComponent: () => Promise.resolve(DummyComponent) },
        ]),
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerDetailComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render customer name in header', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Ivan');
    expect(compiled.textContent).toContain('Ivanov');
  });
});
