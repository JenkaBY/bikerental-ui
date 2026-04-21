import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EquipmentResponse, Pageable } from '@api-models';
import { Equipment, EquipmentStatus, EquipmentType, EquipmentWrite } from '../models';
import { Page } from '../models/common.model';
import { EquipmentMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/equipments`;

  search(
    status?: string,
    type?: string,
    pageable?: Pageable,
    types: EquipmentType[] = [],
    statuses: EquipmentStatus[] = [],
  ): Observable<Page<Equipment>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    if (pageable?.page != null) params = params.set('page', pageable.page);
    if (pageable?.size != null) params = params.set('size', pageable.size);
    if (pageable?.sort) pageable.sort.forEach((s) => (params = params.append('sort', s)));
    return this.http.get<Page<EquipmentResponse>>(this.baseUrl, { params }).pipe(
      map((page) => ({
        ...page,
        items: (page.items ?? []).map((item) =>
          EquipmentMapper.fromResponse(item, types, statuses),
        ),
      })),
    );
  }

  getById(
    id: number,
    types: EquipmentType[] = [],
    statuses: EquipmentStatus[] = [],
  ): Observable<Equipment> {
    return this.http
      .get<EquipmentResponse>(`${this.baseUrl}/${id}`)
      .pipe(map((r) => EquipmentMapper.fromResponse(r, types, statuses)));
  }

  getByUid(
    uid: string,
    types: EquipmentType[] = [],
    statuses: EquipmentStatus[] = [],
  ): Observable<Equipment> {
    return this.http
      .get<EquipmentResponse>(`${this.baseUrl}/by-uid/${uid}`)
      .pipe(map((r) => EquipmentMapper.fromResponse(r, types, statuses)));
  }

  getBySerial(
    serialNumber: string,
    types: EquipmentType[] = [],
    statuses: EquipmentStatus[] = [],
  ): Observable<Equipment> {
    return this.http
      .get<EquipmentResponse>(`${this.baseUrl}/by-serial/${serialNumber}`)
      .pipe(map((r) => EquipmentMapper.fromResponse(r, types, statuses)));
  }

  create(
    write: EquipmentWrite,
    types: EquipmentType[] = [],
    statuses: EquipmentStatus[] = [],
  ): Observable<Equipment> {
    return this.http
      .post<EquipmentResponse>(this.baseUrl, EquipmentMapper.toRequest(write))
      .pipe(map((r) => EquipmentMapper.fromResponse(r, types, statuses)));
  }

  update(
    id: number,
    write: EquipmentWrite,
    types: EquipmentType[] = [],
    statuses: EquipmentStatus[] = [],
  ): Observable<Equipment> {
    return this.http
      .put<EquipmentResponse>(`${this.baseUrl}/${id}`, EquipmentMapper.toRequest(write))
      .pipe(map((r) => EquipmentMapper.fromResponse(r, types, statuses)));
  }
}
