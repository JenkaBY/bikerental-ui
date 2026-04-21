import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EquipmentStatusService } from './equipment-status.service';
import { EquipmentStatus, EquipmentStatusWrite } from '../models';

const BASE_URL = 'http://localhost:8080/api/equipment-statuses';
const mockStatusResponse = { slug: 'available', name: 'Available', allowedTransitions: [] };
const mockStatus: EquipmentStatus = {
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

  it('getAll makes GET request and returns mapped statuses', () => {
    let result: EquipmentStatus[] | undefined;
    service.getAll().subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush([mockStatusResponse]);
    expect(result).toEqual([mockStatus]);
  });

  it('create makes POST request with mapped body', () => {
    const write: EquipmentStatusWrite = {
      slug: 'available',
      name: 'Available',
      allowedTransitions: [],
    };
    let result: EquipmentStatus | undefined;
    service.create(write).subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    req.flush(mockStatusResponse);
    expect(result).toEqual(mockStatus);
  });

  it('update makes PUT request to correct URL with mapped body', () => {
    const write: EquipmentStatusWrite = {
      slug: 'available',
      name: 'Updated',
      allowedTransitions: [],
    };
    let result: EquipmentStatus | undefined;
    service.update('available', write).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/available`);
    expect(req.request.method).toBe('PUT');
    req.flush({ ...mockStatusResponse, name: 'Updated' });
    expect(result?.name).toBe('Updated');
  });
});
