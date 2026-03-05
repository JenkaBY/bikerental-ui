import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Page, Pageable, TariffRequest, TariffResponse, TariffSelectionResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class TariffService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/tariffs`;

  getAll(pageable?: Pageable): Observable<Page<TariffResponse>> {
    let params = new HttpParams();
    if (pageable?.page != null) params = params.set('page', pageable.page);
    if (pageable?.size != null) params = params.set('size', pageable.size);
    if (pageable?.sort) pageable.sort.forEach((s) => (params = params.append('sort', s)));
    return this.http.get<Page<TariffResponse>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<TariffResponse> {
    return this.http.get<TariffResponse>(`${this.baseUrl}/${id}`);
  }

  getActive(equipmentType: string): Observable<TariffResponse[]> {
    const params = new HttpParams().set('equipmentType', equipmentType);
    return this.http.get<TariffResponse[]>(`${this.baseUrl}/active`, { params });
  }

  selectTariff(
    equipmentType: string,
    durationMinutes: number,
    rentalDate?: string,
  ): Observable<TariffSelectionResponse> {
    let params = new HttpParams()
      .set('equipmentType', equipmentType)
      .set('durationMinutes', durationMinutes);
    if (rentalDate) params = params.set('rentalDate', rentalDate);
    return this.http.get<TariffSelectionResponse>(`${this.baseUrl}/selection`, { params });
  }

  create(request: TariffRequest): Observable<TariffResponse> {
    return this.http.post<TariffResponse>(this.baseUrl, request);
  }

  update(id: number, request: TariffRequest): Observable<TariffResponse> {
    return this.http.put<TariffResponse>(`${this.baseUrl}/${id}`, request);
  }

  activate(id: number): Observable<TariffResponse> {
    return this.http.patch<TariffResponse>(`${this.baseUrl}/${id}/activate`, null);
  }

  deactivate(id: number): Observable<TariffResponse> {
    return this.http.patch<TariffResponse>(`${this.baseUrl}/${id}/deactivate`, null);
  }
}
