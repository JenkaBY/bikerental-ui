import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { EquipmentTypeService } from './equipment-type.service';
import { EquipmentTypeResponse } from '../models';
import { EquipmentType, EquipmentTypeWrite } from '../domain';

const BASE_URL = 'http://localhost:8080/api/equipment-types';
const mockType: EquipmentTypeResponse = { slug: 'bike', name: 'Bike', description: 'A bicycle' };
const mockDomain: EquipmentType = { slug: 'bike', name: 'Bike', description: 'A bicycle' };

describe('EquipmentTypeService', () => {
  let service: EquipmentTypeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EquipmentTypeService],
    });
    service = TestBed.inject(EquipmentTypeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getAll makes GET request and returns types mapped to domain', () => {
    let result: EquipmentType[] | undefined;
    service.getAll().subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush([mockType]);
    expect(result).toEqual([mockDomain]);
  });

  it('create makes POST request with body and returns domain type', () => {
    const request: EquipmentTypeWrite = { slug: 'bike', name: 'Bike', description: 'A bicycle' };
    let result: EquipmentType | undefined;
    service.create(request).subscribe((r) => (result = r));
    const req = httpMock.expectOne(BASE_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(request);
    req.flush(mockType);
    expect(result).toEqual(mockDomain);
  });

  it('update makes PUT request to correct URL with body and returns domain type', () => {
    const request: EquipmentTypeWrite = { slug: 'bike', name: 'Updated Bike' };
    let result: EquipmentType | undefined;
    service.update(request).subscribe((r) => (result = r));
    const req = httpMock.expectOne(`${BASE_URL}/bike`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ name: 'Updated Bike' });
    req.flush({ ...mockType, name: 'Updated Bike' });
    expect(result?.name).toBe('Updated Bike');
  });
});
