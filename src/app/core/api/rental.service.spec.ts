import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { RentalService } from './rental.service';
import {
  CreateRentalRequest,
  Page,
  PrepaymentResponse,
  RecordPrepaymentRequest,
  RentalResponse,
  RentalSummaryResponse,
  RentalUpdateJsonPatchRequest,
  ReturnEquipmentRequest,
} from '../models';

const BASE_URL = 'http://localhost:8080/api/rentals';
const mockRental: RentalResponse = { id: 1, status: 'ACTIVE' };
const mockSummary: RentalSummaryResponse = { id: 1, status: 'ACTIVE' };
const mockPage: Page<RentalSummaryResponse> = { items: [mockSummary], totalItems: 1 };

describe('RentalService', () => {
  let service: RentalService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), RentalService],
    });
    service = TestBed.inject(RentalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('search without params makes GET to base URL', () => {
    service.search().subscribe();
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush(mockPage);
  });

  it('search with all params appends them', () => {
    service
      .search('ACTIVE', 'cust-1', 'uid-1', { page: 0, size: 5, sort: ['id,desc'] })
      .subscribe();
    const req = httpMock.expectOne((r) => r.url === BASE_URL);
    expect(req.request.params.get('status')).toBe('ACTIVE');
    expect(req.request.params.get('customerId')).toBe('cust-1');
    expect(req.request.params.get('equipmentUid')).toBe('uid-1');
    expect(req.request.params.get('page')).toBe('0');
    expect(req.request.params.get('size')).toBe('5');
    expect(req.request.params.getAll('sort')).toContain('id,desc');
    req.flush(mockPage);
  });

  it('getById makes GET to /rentals/:id', () => {
    service.getById(1).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockRental);
  });

  it('create makes POST to base URL', () => {
    const request: CreateRentalRequest = { customerId: 'c-1', equipmentId: 1, duration: 'PT1H' };
    service.create(request).subscribe();
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockRental);
  });

  it('createDraft makes POST to /rentals/draft', () => {
    service.createDraft().subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/draft`);
    expect(req.request.method).toBe('POST');
    req.flush(mockRental);
  });

  it('update makes PATCH to /rentals/:id', () => {
    const request: RentalUpdateJsonPatchRequest = {
      operations: [{ op: 'replace', path: '/status', value: 'ACTIVE' }],
    };
    service.update(1, request).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/1`);
    expect(req.request.method).toBe('PATCH');
    req.flush(mockRental);
  });

  it('recordPrepayment makes POST to /rentals/:id/prepayments', () => {
    const request: RecordPrepaymentRequest = {
      amount: 100,
      paymentMethod: 'CASH',
      operatorId: 'op-1',
    };
    const mockPrep: PrepaymentResponse = {
      paymentId: 'p-1',
      receiptNumber: 'R-1',
      amount: 100,
      paymentMethod: 'CASH',
      createdAt: '2026-01-01T10:00:00Z',
    };
    service.recordPrepayment(1, request).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/1/prepayments`);
    expect(req.request.method).toBe('POST');
    req.flush(mockPrep);
  });

  it('returnEquipment makes POST to /rentals/return', () => {
    const request: ReturnEquipmentRequest = { rentalId: 1, paymentMethod: 'CASH' };
    service.returnEquipment(request).subscribe();
    const req = httpMock.expectOne(`${BASE_URL}/return`);
    expect(req.request.method).toBe('POST');
    req.flush({});
  });
});
