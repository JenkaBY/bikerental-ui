import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { map, shareReplay, startWith, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Page, Tariff, TariffSelection, TariffWrite } from '@ui-models';
import {
  Pageable,
  PageTariffV2Response,
  PricingTypeResponse,
  TariffSelectionV2Response,
  TariffV2Request,
  TariffV2Response,
} from '@api-models';
import { TariffMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class TariffService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/tariffs`;
  private pricingTypesRefresh$ = new Subject<void>();
  private pricingTypes$ = this.pricingTypesRefresh$.pipe(
    startWith(void 0),
    switchMap(() => this.http.get<PricingTypeResponse[]>(`${this.baseUrl}/pricing-types`)),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  getAll(pageable?: Pageable): Observable<Page<Tariff>> {
    let params = new HttpParams();
    if (pageable?.page != null) params = params.set('page', pageable.page);
    if (pageable?.size != null) params = params.set('size', pageable.size);
    if (pageable?.sort) pageable.sort.forEach((s) => (params = params.append('sort', s)));
    return this.http.get<PageTariffV2Response>(this.baseUrl, { params }).pipe(
      map((p) => ({
        items: (p.items ?? []).map(TariffMapper.fromResponse),
        totalItems: p.totalItems ?? 0,
        pageRequest: p.pageRequest,
      })),
    );
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

  refreshPricingTypes(): void {
    this.pricingTypesRefresh$.next();
  }

  selectTariff(
    equipmentType: string,
    durationMinutes: number,
    rentalDate?: string,
  ): Observable<TariffSelection> {
    let params = new HttpParams()
      .set('equipmentType', equipmentType)
      .set('durationMinutes', durationMinutes);
    if (rentalDate) params = params.set('rentalDate', rentalDate);
    return this.http.get<TariffSelectionV2Response>(`${this.baseUrl}/selection`, { params }).pipe(
      map((r) => ({
        tariff: TariffMapper.fromResponse(r.tariff!),
        totalCost: r.totalCost ?? 0,
        calculationBreakdown: r.calculationBreakdown ?? {},
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
