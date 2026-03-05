import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipmentStatusRequest, EquipmentStatusResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class EquipmentStatusService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/equipment-statuses`;

  getAll(): Observable<EquipmentStatusResponse[]> {
    return this.http.get<EquipmentStatusResponse[]>(this.baseUrl);
  }

  create(request: EquipmentStatusRequest): Observable<EquipmentStatusResponse> {
    return this.http.post<EquipmentStatusResponse>(this.baseUrl, request);
  }

  update(slug: string, request: EquipmentStatusRequest): Observable<EquipmentStatusResponse> {
    return this.http.put<EquipmentStatusResponse>(`${this.baseUrl}/${slug}`, request);
  }
}
