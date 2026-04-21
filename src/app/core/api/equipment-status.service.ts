import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { EquipmentStatusRequest, EquipmentStatusResponse } from '@api-models';
import { EquipmentStatus, EquipmentStatusWrite } from '../models';
import { EquipmentStatusMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class EquipmentStatusService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/equipment-statuses`;

  getAll(): Observable<EquipmentStatus[]> {
    return this.http
      .get<EquipmentStatusResponse[]>(this.baseUrl)
      .pipe(map((list) => list.map(EquipmentStatusMapper.fromResponse)));
  }

  create(write: EquipmentStatusWrite): Observable<EquipmentStatus> {
    const request: EquipmentStatusRequest = EquipmentStatusMapper.toCreateRequest(write);
    return this.http
      .post<EquipmentStatusResponse>(this.baseUrl, request)
      .pipe(map(EquipmentStatusMapper.fromResponse));
  }

  update(slug: string, write: EquipmentStatusWrite): Observable<EquipmentStatus> {
    const request: EquipmentStatusRequest = EquipmentStatusMapper.toUpdateRequest(write);
    return this.http
      .put<EquipmentStatusResponse>(`${this.baseUrl}/${slug}`, request)
      .pipe(map(EquipmentStatusMapper.fromResponse));
  }
}
