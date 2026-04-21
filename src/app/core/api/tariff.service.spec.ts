import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TariffService } from './tariff.service';
import { Page, Tariff, TariffSelection, TariffWrite } from '@ui-models';
import { PricingTypeResponse, TariffSelectionV2Response, TariffV2Response } from '@api-models';

const BASE_URL = 'http://localhost:8080/api/tariffs';
const mockTariff: TariffV2Response = {
  id: 1,
  name: 'Hourly',
  equipmentType: 'bike',
  description: undefined,
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 100 },
  validFrom: '2026-01-01' as unknown as Date,
  status: 'ACTIVE',
};
const mockPage = { items: [mockTariff], totalItems: 1 };
const validWrite: TariffWrite = {
  name: 'Hourly',
  equipmentTypeSlug: 'bike',
  pricingType: 'FLAT_HOURLY',
  params: { hourlyPrice: 100 },
  validFrom: new Date('2026-01-01'),
};

describe('TariffService', () => {
  let service: TariffService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), TariffService],
    });
    service = TestBed.inject(TariffService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll without pageable makes GET to base URL and maps items', () => {
    let result: Page<Tariff> | undefined;
    service.getAll().subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
    expect(result?.totalItems).toBe(1);
    expect(result?.items[0].id).toBe(mockTariff.id);
    expect(result?.items[0].pricingType).toBe(mockTariff.pricingType);
  });

  it('getAll with pageable appends page, size, sort params', () => {
    service.getAll({ page: 0, size: 5, sort: ['name,asc'] }).subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('5');
    expect(req.request.params.getAll('sort')).toContain('name,asc');
    req.flush(mockPage);
  });

  it('getById makes GET to /tariffs/:id and maps response', () => {
    let result: Tariff | undefined;
    service.getById(1).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTariff);
    expect(result?.id).toBe(mockTariff.id);
  });

  it('getActive makes GET with equipmentType param and maps items', () => {
    let result: Tariff[] | undefined;
    service.getActive('bike').subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/active?equipmentType=bike`);
    expect(req.request.method).toBe('GET');
    req.flush([mockTariff]);
    expect(result?.[0].id).toBe(mockTariff.id);
  });

  it('selectTariff makes GET with required params', () => {
    const mockSel: TariffSelectionV2Response = {
      tariff: mockTariff,
      totalCost: 100,
      calculationBreakdown: { message: 'ok', breakdownPatternCode: 'FLAT' },
    };
    let result: TariffSelection | undefined;
    service.selectTariff('bike', 60).subscribe((r) => (result = r));
    const req = httpMock.expectOne((r) => r.url === `${BASE_URL}/selection`);
    expect(req.request.params.get('equipmentType')).toBe('bike');
    expect(req.request.params.get('durationMinutes')).toBe('60');
    req.flush(mockSel);
    expect(result).toBeDefined();
    expect(result!.totalCost).toBe(100);
    expect(result!.tariff.id).toBe(mockTariff.id);
  });

  it('selectTariff appends rentalDate when provided', () => {
    const mockSel2: TariffSelectionV2Response = {
      tariff: mockTariff,
      totalCost: 0,
      calculationBreakdown: { message: 'ok', breakdownPatternCode: 'FLAT' },
    };
    let result: TariffSelection | undefined;
    service.selectTariff('bike', 60, '2026-01-01').subscribe((r) => (result = r));
    const req = httpMock.expectOne((r) => r.url === `${BASE_URL}/selection`);
    expect(req.request.params.get('rentalDate')).toBe('2026-01-01');
    req.flush(mockSel2);
    expect(result).toBeDefined();
    expect(result!.tariff.id).toBe(mockTariff.id);
  });

  it('create makes POST request and maps response', () => {
    let result: Tariff | undefined;
    service.create(validWrite).subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    // body should have ISO date string for validFrom
    expect(req.request.body.name).toBe(validWrite.name);
    expect(req.request.body.validFrom).toBe('2026-01-01');
    req.flush(mockTariff);
    expect(result?.id).toBe(mockTariff.id);
  });

  it('update makes PUT to /tariffs/:id and maps response', () => {
    let result: Tariff | undefined;
    service.update(1, validWrite).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.name).toBe(validWrite.name);
    req.flush(mockTariff);
    expect(result?.id).toBe(mockTariff.id);
  });

  it('activate makes PATCH to /tariffs/:id/activate and maps response', () => {
    let result: Tariff | undefined;
    service.activate(1).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockTariff);
    expect(result?.id).toBe(mockTariff.id);
  });

  it('deactivate makes PATCH to /tariffs/:id/deactivate and maps response', () => {
    let result: Tariff | undefined;
    service.deactivate(1).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/1/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockTariff);
    expect(result?.id).toBe(mockTariff.id);
  });

  it('getPricingTypes makes GET to /pricing-types and returns array', () => {
    const mockTypes: PricingTypeResponse[] = [
      { slug: 'FLAT_HOURLY', title: 'Flat hourly', description: 'Flat hourly pricing' },
    ];
    let result: PricingTypeResponse[] | undefined;
    service.getPricingTypes().subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/pricing-types`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTypes);
    expect(result).toEqual(mockTypes);
  });

  it('getPricingTypes is cached and refreshPricingTypes forces reload', () => {
    const first: PricingTypeResponse[] = [{ slug: 'FLAT_HOURLY', title: '', description: '' }];
    const second: PricingTypeResponse[] = [
      { slug: 'DEGRESSIVE_HOURLY', title: '', description: '' },
    ];

    let firstResult: PricingTypeResponse[] | undefined;
    service.getPricingTypes().subscribe((r) => (firstResult = r));
    const req1 = httpMock.expectOne(`${BASE_URL}/pricing-types`);
    req1.flush(first);
    expect(firstResult).toEqual(first);

    // subscribe again - should return cached value without new http request
    let cachedResult: PricingTypeResponse[] | undefined;
    service.getPricingTypes().subscribe((r) => (cachedResult = r));
    // no additional requests expected
    httpMock.expectNone(`${BASE_URL}/pricing-types`);
    expect(cachedResult).toEqual(first);

    // force refresh
    service.refreshPricingTypes();
    const req2 = httpMock.expectOne(`${BASE_URL}/pricing-types`);
    req2.flush(second);
    let refreshed: PricingTypeResponse[] | undefined;
    service.getPricingTypes().subscribe((r) => (refreshed = r));
    expect(refreshed).toEqual(second);
  });
});
