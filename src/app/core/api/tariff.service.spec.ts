import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TariffService } from './tariff.service';
import { Page, TariffRequest, TariffResponse, TariffSelectionResponse } from '../models';

const BASE_URL = 'http://localhost:8080/api/tariffs';
const mockTariff: TariffResponse = {
  id: 1,
  name: 'Hourly',
  equipmentTypeSlug: 'bike',
  basePrice: 0,
  halfHourPrice: 50,
  hourPrice: 100,
  dayPrice: 600,
  hourDiscountedPrice: 80,
  validFrom: '2026-01-01',
  status: 'ACTIVE',
};
const mockPage: Page<TariffResponse> = { items: [mockTariff], totalItems: 1 };
const validRequest: TariffRequest = {
  name: 'Hourly',
  equipmentTypeSlug: 'bike',
  basePrice: 0,
  halfHourPrice: 50,
  hourPrice: 100,
  dayPrice: 600,
  hourDiscountedPrice: 80,
  validFrom: '2026-01-01',
  status: 'ACTIVE',
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

  it('getAll without pageable makes GET to base URL', () => {
    let result: Page<TariffResponse> | undefined;
    service.getAll().subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
    expect(result).toEqual(mockPage);
  });

  it('getAll with pageable appends page, size, sort params', () => {
    service.getAll({ page: 0, size: 5, sort: ['name,asc'] }).subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('5');
    expect(req.request.params.getAll('sort')).toContain('name,asc');
    req.flush(mockPage);
  });

  it('getById makes GET to /tariffs/:id', () => {
    service.getById(1).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockTariff);
  });

  it('getActive makes GET with equipmentType param', () => {
    let result: TariffResponse[] | undefined;
    service.getActive('bike').subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/active?equipmentType=bike`);
    expect(req.request.method).toBe('GET');
    req.flush([mockTariff]);
    expect(result).toEqual([mockTariff]);
  });

  it('selectTariff makes GET with required params', () => {
    const mockSel: TariffSelectionResponse = {
      id: 1,
      name: 'Hourly',
      equipmentType: 'bike',
      price: 100,
      period: 'HOUR',
    };
    service.selectTariff('bike', 60).subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE_URL}/selection`);
    expect(req.request.params.get('equipmentType')).toBe('bike');
    expect(req.request.params.get('durationMinutes')).toBe('60');
    req.flush(mockSel);
  });

  it('selectTariff appends rentalDate when provided', () => {
    service.selectTariff('bike', 60, '2026-01-01').subscribe();
    const req = httpMock.expectOne((r) => r.url === `${BASE_URL}/selection`);
    expect(req.request.params.get('rentalDate')).toBe('2026-01-01');
    req.flush({});
  });

  it('create makes POST request', () => {
    service.create(validRequest).subscribe();
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(validRequest);
    req.flush(mockTariff);
  });

  it('update makes PUT to /tariffs/:id', () => {
    service.update(1, validRequest).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/1`);
    expect(req.request.method).toBe('PUT');
    req.flush(mockTariff);
  });

  it('activate makes PATCH to /tariffs/:id/activate', () => {
    service.activate(1).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/1/activate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockTariff);
  });

  it('deactivate makes PATCH to /tariffs/:id/deactivate', () => {
    service.deactivate(1).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/1/deactivate`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockTariff);
  });
});
