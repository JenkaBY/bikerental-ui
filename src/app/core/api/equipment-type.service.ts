import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipmentTypeRequest, EquipmentTypeResponse, EquipmentTypeUpdateRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class EquipmentTypeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/equipment-types`;

  getAll(): Observable<EquipmentTypeResponse[]> {
    return this.http.get<EquipmentTypeResponse[]>(this.baseUrl);
  }

  create(request: EquipmentTypeRequest): Observable<EquipmentTypeResponse> {
    return this.http.post<EquipmentTypeResponse>(this.baseUrl, request);
  }

  update(slug: string, request: EquipmentTypeUpdateRequest): Observable<EquipmentTypeResponse> {
    return this.http.put<EquipmentTypeResponse>(`${this.baseUrl}/${slug}`, request);
  }
}
