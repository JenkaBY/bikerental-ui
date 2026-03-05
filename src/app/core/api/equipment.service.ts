import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipmentRequest, EquipmentResponse, Page, Pageable } from '../models';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/equipments`;

  search(status?: string, type?: string, pageable?: Pageable): Observable<Page<EquipmentResponse>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    if (pageable?.page != null) params = params.set('page', pageable.page);
    if (pageable?.size != null) params = params.set('size', pageable.size);
    if (pageable?.sort) pageable.sort.forEach((s) => (params = params.append('sort', s)));
    return this.http.get<Page<EquipmentResponse>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<EquipmentResponse> {
    return this.http.get<EquipmentResponse>(`${this.baseUrl}/${id}`);
  }

  getByUid(uid: string): Observable<EquipmentResponse> {
    return this.http.get<EquipmentResponse>(`${this.baseUrl}/by-uid/${uid}`);
  }

  getBySerial(serialNumber: string): Observable<EquipmentResponse> {
    return this.http.get<EquipmentResponse>(`${this.baseUrl}/by-serial/${serialNumber}`);
  }

  create(request: EquipmentRequest): Observable<EquipmentResponse> {
    return this.http.post<EquipmentResponse>(this.baseUrl, request);
  }

  update(id: number, request: EquipmentRequest): Observable<EquipmentResponse> {
    return this.http.put<EquipmentResponse>(`${this.baseUrl}/${id}`, request);
  }
}
