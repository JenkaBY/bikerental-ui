import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page } from '@ui-models';
import {
  CreateRentalRequest,
  Pageable,
  RentalResponse,
  RentalSummaryResponse,
  RentalUpdateJsonPatchRequest,
} from '@api-models';

@Injectable({ providedIn: 'root' })
export class RentalService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/rentals`;

  search(
    status?: string,
    customerId?: string,
    equipmentUid?: string,
    pageable?: Pageable,
  ): Observable<Page<RentalSummaryResponse>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (customerId) params = params.set('customerId', customerId);
    if (equipmentUid) params = params.set('equipmentUid', equipmentUid);
    if (pageable?.page != null) params = params.set('page', pageable.page);
    if (pageable?.size != null) params = params.set('size', pageable.size);
    if (pageable?.sort) pageable.sort.forEach((s) => (params = params.append('sort', s)));
    return this.http.get<Page<RentalSummaryResponse>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<RentalResponse> {
    return this.http.get<RentalResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateRentalRequest): Observable<RentalResponse> {
    return this.http.post<RentalResponse>(this.baseUrl, request);
  }

  createDraft(): Observable<RentalResponse> {
    return this.http.post<RentalResponse>(`${this.baseUrl}/draft`, null);
  }

  update(id: number, request: RentalUpdateJsonPatchRequest): Observable<RentalResponse> {
    return this.http.patch<RentalResponse>(`${this.baseUrl}/${id}`, request);
  }
}
