import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EquipmentService } from './equipment.service';
import { Equipment, EquipmentWrite, Page } from '@ui-models';
import { EquipmentResponse } from '@api-models';

const BASE_URL = 'http://localhost:8080/api/equipments';
const mockEquipmentResponse: EquipmentResponse = {
  id: 1,
  serialNumber: 'SN-001',
  uid: 'UID-001',
  model: '',
  type: 'bike',
  status: 'available',
};
const mockEquipment: Equipment = {
  id: 1,
  serialNumber: 'SN-001',
  uid: 'UID-001',
  type: { slug: 'bike', name: 'bike', isForSpecialTariff: false },
  model: '',
  status: { slug: 'available', name: 'available', allowedTransitions: [] },
};
const mockPage: Page<EquipmentResponse> = { items: [mockEquipmentResponse], totalItems: 1 };

describe('EquipmentService', () => {
  let service: EquipmentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EquipmentService],
    });
    service = TestBed.inject(EquipmentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('search without params makes GET and maps response', () => {
    let result: Page<Equipment> | undefined;
    service.search().subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
    expect(result?.items?.[0].type.slug).toBe('bike');
    expect(result?.items?.[0].status.slug).toBe('available');
  });

  it('search with status and type appends params', () => {
    service.search('available', 'bike').subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get('status')).toBe('available');
    expect(req.request.params.get('type')).toBe('bike');
    req.flush(mockPage);
  });

  it('search with pageable appends page and size params', () => {
    service.search(undefined, undefined, { page: 0, size: 10 }).subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('10');
    req.flush(mockPage);
  });

  it('getById makes GET and maps response', () => {
    let result: Equipment | undefined;
    service.getById(1).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEquipmentResponse);
    expect(result).toEqual(mockEquipment);
  });

  it('getByUid makes GET to /equipments/by-uid/:uid', () => {
    service.getByUid('UID-001').subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/by-uid/UID-001`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEquipmentResponse);
  });

  it('getBySerial makes GET to /equipments/by-serial/:serial', () => {
    service.getBySerial('SN-001').subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/by-serial/SN-001`);
    expect(req.request.method).toBe('GET');
    req.flush(mockEquipmentResponse);
  });

  it('create makes POST request with mapped body', () => {
    const write: EquipmentWrite = { serialNumber: 'SN-001', typeSlug: 'bike' };
    let result: Equipment | undefined;
    service.create(write).subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ serialNumber: 'SN-001', typeSlug: 'bike' });
    req.flush(mockEquipmentResponse);
    expect(result).toEqual(mockEquipment);
  });

  it('update makes PUT request to correct URL with mapped body', () => {
    const write: EquipmentWrite = { serialNumber: 'SN-002', statusSlug: 'maintenance' };
    service.update(1, write).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ serialNumber: 'SN-002', statusSlug: 'maintenance' });
    req.flush({ ...mockEquipmentResponse, serialNumber: 'SN-002', status: 'maintenance' });
  });
});
