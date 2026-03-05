import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomerRequest, CustomerResponse, CustomerSearchResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/customers`;

  searchByPhone(phone: string): Observable<CustomerSearchResponse[]> {
    const params = new HttpParams().set('phone', phone);
    return this.http.get<CustomerSearchResponse[]>(this.baseUrl, { params });
  }

  createCustomer(request: CustomerRequest): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(this.baseUrl, request);
  }

  updateCustomer(id: string, request: CustomerRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.baseUrl}/${id}`, request);
  }
}
