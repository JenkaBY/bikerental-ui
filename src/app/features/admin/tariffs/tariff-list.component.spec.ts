import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TariffListComponent } from './tariff-list.component';
import { TariffService } from '../../../core/api';
import { Tariff } from '../../../core/domain';
import { PageEvent } from '@angular/material/paginator';

const mockTariff: Tariff = {
  id: 1,
  name: 'Hourly',
  equipmentType: 'bike',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 100 },
  validFrom: new Date('2026-01-01'),
  status: 'ACTIVE',
};

describe('TariffListComponent', () => {
  let fixture: ComponentFixture<TariffListComponent>;
  let component: TariffListComponent;
  let mockService: { getAll: ReturnType<typeof vi.fn>; getPricingTypes: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockService = {
      getAll: vi.fn().mockReturnValue(of({ items: [mockTariff], totalItems: 1 })),
      getPricingTypes: vi.fn().mockReturnValue(of([])),
    } as unknown as { getAll: ReturnType<typeof vi.fn>; getPricingTypes: ReturnType<typeof vi.fn> };

    await TestBed.configureTestingModule({
      imports: [TariffListComponent],
      providers: [{ provide: TariffService, useValue: mockService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TariffListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and displays tariffs on init', () => {
    expect(mockService.getAll).toHaveBeenCalled();
    expect(component.items().length).toBe(1);
    expect(component.totalItems()).toBe(1);
  });

  it('shows empty state when no items', async () => {
    mockService.getAll.mockReturnValueOnce(of({ items: [], totalItems: 0 }));
    component.refresh();
    fixture.detectChanges();
    expect(component.items().length).toBe(0);
    expect(component.totalItems()).toBe(0);
  });

  it('paginator changes trigger getAll with correct pageable', () => {
    component.onPage({ pageIndex: 2, pageSize: 25 } as PageEvent);
    expect(mockService.getAll).toHaveBeenCalled();
  });
});
