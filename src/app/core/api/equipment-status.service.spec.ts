import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EquipmentStatusService } from './equipment-status.service';
import {
  EquipmentStatusRequest,
  EquipmentStatusResponse,
  EquipmentStatusUpdateRequest,
} from '@api-models';

const BASE_URL = 'http://localhost:8080/api/equipment-statuses';
const mockStatusResponse: EquipmentStatusResponse = {
  slug: 'available',
  name: 'Available',
  allowedTransitions: [],
};

describe('EquipmentStatusService', () => {
  let service: EquipmentStatusService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EquipmentStatusService],
    });
    service = TestBed.inject(EquipmentStatusService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll makes GET request and returns API response', () => {
    let result: EquipmentStatusResponse[] | undefined;
    service.getAll().subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush([mockStatusResponse]);
    expect(result).toEqual([mockStatusResponse]);
  });

  it('create makes POST request with API request body and returns API response', () => {
    const request: EquipmentStatusRequest = {
      slug: 'available',
      name: 'Available',
      allowedTransitions: [],
    };
    let result: EquipmentStatusResponse | undefined;
    service.create(request).subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockStatusResponse);
    expect(result).toEqual(mockStatusResponse);
  });

  it('update makes PUT request to correct URL with API request body and returns API response', () => {
    const request: EquipmentStatusUpdateRequest = {
      name: 'Updated',
      allowedTransitions: [],
    };
    let result: EquipmentStatusResponse | undefined;
    service.update('available', request).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/available`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(request);
    req.flush({ ...mockStatusResponse, name: 'Updated' });
    expect(result?.name).toBe('Updated');
  });
});
