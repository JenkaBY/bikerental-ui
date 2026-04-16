import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Page, Pageable, PricingTypeResponse, TariffV2Request, TariffV2Response } from '../models';
import { Tariff, TariffWrite } from '../domain';
import { TariffMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class TariffService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/tariffs`;
  // refresh trigger for pricing types cache
  private pricingTypesRefresh$ = new Subject<void>();
  private pricingTypes$ = this.pricingTypesRefresh$.pipe(
    startWith(void 0),
    switchMap(() => this.http.get<PricingTypeResponse[]>(`${this.baseUrl}/pricing-types`)),
    // cache latest array for subscribers
    // shareReplay via rxjs/operators shareReplay used with buffer 1
    shareReplay({ bufferSize: 1, refCount: false }),
  );
  getAll(pageable?: Pageable): Observable<Page<Tariff>> {
    let params = new HttpParams();
    if (pageable?.page != null) params = params.set('page', pageable.page);
    if (pageable?.size != null) params = params.set('size', pageable.size);
    if (pageable?.sort) pageable.sort.forEach((s) => (params = params.append('sort', s)));
    return this.http
      .get<Page<TariffV2Response>>(this.baseUrl, { params })
      .pipe(map((p) => ({ ...p, items: p.items.map(TariffMapper.fromResponse) })));
  }

  getById(id: number): Observable<Tariff> {
    return this.http
      .get<TariffV2Response>(`${this.baseUrl}/${id}`)
      .pipe(map(TariffMapper.fromResponse));
  }

  getActive(equipmentType: string): Observable<Tariff[]> {
    const params = new HttpParams().set('equipmentType', equipmentType);
    return this.http
      .get<TariffV2Response[]>(`${this.baseUrl}/active`, { params })
      .pipe(map((items) => items.map(TariffMapper.fromResponse)));
  }

  getPricingTypes(): Observable<PricingTypeResponse[]> {
    return this.pricingTypes$;
  }

  // force reload of pricing types from backend
  refreshPricingTypes(): void {
    this.pricingTypesRefresh$.next();
  }

  selectTariff(
    equipmentType: string,
    durationMinutes: number,
    rentalDate?: string,
  ): Observable<import('../domain').TariffSelection> {
    let params = new HttpParams()
      .set('equipmentType', equipmentType)
      .set('durationMinutes', durationMinutes);
    if (rentalDate) params = params.set('rentalDate', rentalDate);
    return this.http
      .get<import('../models').TariffSelectionResponse>(`${this.baseUrl}/selection`, { params })
      .pipe(
        map((r) => ({
          tariff: TariffMapper.fromResponse(r.tariff),
          totalCost: r.totalCost,
          calculationBreakdown: r.calculationBreakdown,
        })),
      );
  }

  create(write: TariffWrite): Observable<Tariff> {
    const req: TariffV2Request = TariffMapper.toRequest(write) as TariffV2Request;
    return this.http.post<TariffV2Response>(this.baseUrl, req).pipe(map(TariffMapper.fromResponse));
  }

  update(id: number, write: TariffWrite): Observable<Tariff> {
    const req: TariffV2Request = TariffMapper.toRequest(write) as TariffV2Request;
    return this.http
      .put<TariffV2Response>(`${this.baseUrl}/${id}`, req)
      .pipe(map(TariffMapper.fromResponse));
  }

  activate(id: number): Observable<Tariff> {
    return this.http
      .patch<TariffV2Response>(`${this.baseUrl}/${id}/activate`, null)
      .pipe(map(TariffMapper.fromResponse));
  }

  deactivate(id: number): Observable<Tariff> {
    return this.http
      .patch<TariffV2Response>(`${this.baseUrl}/${id}/deactivate`, null)
      .pipe(map(TariffMapper.fromResponse));
  }
}
