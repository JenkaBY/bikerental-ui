import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { PaymentService } from './payment.service';
import { PaymentResponse, RecordPaymentRequest, RecordPaymentResponse } from '../models';

const BASE_URL = 'http://localhost:8080/api/payments';
const mockPayment: PaymentResponse = {
  id: 'pay-1',
  rentalId: 1,
  amount: 500,
  paymentType: 'FINAL',
  paymentMethod: 'CASH',
  createdAt: '2026-01-01T10:00:00Z',
};

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), PaymentService],
    });
    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getById makes GET to /payments/:id', () => {
    let result: PaymentResponse | undefined;
    service.getById('pay-1').subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/pay-1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPayment);
    expect(result).toEqual(mockPayment);
  });

  it('getByRental makes GET to /payments/by-rental/:rentalId', () => {
    let result: PaymentResponse[] | undefined;
    service.getByRental(1).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/by-rental/1`);
    expect(req.request.method).toBe('GET');
    req.flush([mockPayment]);
    expect(result).toEqual([mockPayment]);
  });

  it('record makes POST request with body', () => {
    const request: RecordPaymentRequest = {
      rentalId: 1,
      amount: 500,
      paymentType: 'ADDITIONAL_PAYMENT',
      paymentMethod: 'CASH',
    };
    const mockResp: RecordPaymentResponse = { paymentId: 'pay-1', receiptNumber: 'R-001' };
    let result: RecordPaymentResponse | undefined;
    service.record(request).subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockResp);
    expect(result).toEqual(mockResp);
  });
});
