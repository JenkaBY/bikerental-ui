import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaymentResponse, RecordPaymentRequest, RecordPaymentResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/payments`;

  getById(id: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/${id}`);
  }

  getByRental(rentalId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.baseUrl}/by-rental/${rentalId}`);
  }

  record(request: RecordPaymentRequest): Observable<RecordPaymentResponse> {
    return this.http.post<RecordPaymentResponse>(this.baseUrl, request);
  }
}
