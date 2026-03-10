import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { CustomerService } from './customer.service';
import { CustomerRequest, CustomerResponse, CustomerSearchResponse } from '../models';

const BASE_URL = 'http://localhost:8080/api/customers';
const mockCustomer: CustomerResponse = {
  id: 'uuid-1',
  phone: '+70001112233',
  firstName: 'Ivan',
  lastName: 'Ivanov',
};

describe('CustomerService', () => {
  let service: CustomerService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CustomerService],
    });
    service = TestBed.inject(CustomerService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('searchByPhone makes GET with phone param', () => {
    const mockSearch: CustomerSearchResponse = {
      id: 'uuid-1',
      phone: '+70001112233',
      firstName: 'Ivan',
      lastName: 'Ivanov',
    };
    let result: CustomerSearchResponse[] | undefined;
    service.searchByPhone('+70001112233').subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}?phone=%2B70001112233`);
    expect(req.request.method).toBe('GET');
    req.flush([mockSearch]);
    expect(result).toEqual([mockSearch]);
  });

  it('createCustomer makes POST request', () => {
    const request: CustomerRequest = {
      phone: '+70001112233',
      firstName: 'Ivan',
      lastName: 'Ivanov',
    };
    let result: CustomerResponse | undefined;
    service.createCustomer(request).subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockCustomer);
    expect(result).toEqual(mockCustomer);
  });

  it('updateCustomer makes PUT request to correct URL', () => {
    const request: CustomerRequest = {
      phone: '+70001112233',
      firstName: 'Updated',
      lastName: 'Name',
    };
    let result: CustomerResponse | undefined;
    service.updateCustomer('uuid-1', request).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/uuid-1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ ...mockCustomer, firstName: 'Updated' });
    expect(result?.firstName).toBe('Updated');
  });
});
