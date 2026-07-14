import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, defaultIfEmpty, finalize, map, switchMap, tap } from 'rxjs/operators';
import {
  CostCalculationV2Request,
  CostCalculationResponse,
  CostQuoteResponse,
  TariffsService,
} from '../api/generated';
import { Tariff, TariffWrite } from '../models';
import { TariffMapper } from '../mappers';
import { suppressErrorNotification } from '../errors';
import { EquipmentTypeStore } from './equipment-type.store';
import { PricingTypeStore } from './pricing-type.store';

@Injectable({ providedIn: 'root' })
export class TariffStore {
  private service = inject(TariffsService);
  private equipmentTypeStore = inject(EquipmentTypeStore);
  private pricingTypeStore = inject(PricingTypeStore);

  private readonly _tariffs = signal<Tariff[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _currentPage = signal(0);
  private readonly _pageSize = signal(10);
  private readonly _totalItems = signal(0);

  private readonly _specialTariffId = signal<number | null>(null);

  readonly tariffs = computed(() => this._tariffs());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());
  readonly currentPage = computed(() => this._currentPage());
  readonly pageSize = computed(() => this._pageSize());
  readonly totalItems = computed(() => this._totalItems());
  readonly specialTariffId = computed(() => this._specialTariffId());

  load(): Observable<void> {
    this._loading.set(true);
    const pageableRequest = {
      page: this._currentPage(),
      size: this._pageSize(),
    };
    const equipmentTypes = this.equipmentTypeStore.types();
    const pricingTypes = this.pricingTypeStore.pricingTypes();
    return this.service.getAllTariffs(pageableRequest).pipe(
      map((response) => ({
        items: (response.items ?? []).map((r) =>
          TariffMapper.fromResponse(r, equipmentTypes, pricingTypes),
        ),
        totalItems: response.totalItems ?? 0,
        pageRequest: response.pageRequest,
      })),
      tap((page) => {
        this._tariffs.set(page.items);
        this._totalItems.set(page.totalItems);
      }),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
      catchError(() => {
        return EMPTY;
      }),
    );
  }

  setPage(page: number, size: number): void {
    this._currentPage.set(page);
    this._pageSize.set(size);
    this.load().subscribe();
  }

  create(write: TariffWrite): Observable<Tariff> {
    this._saving.set(true);
    const equipmentTypes = this.equipmentTypeStore.types();
    const pricingTypes = this.pricingTypeStore.pricingTypes();
    return this.service.createTariff(TariffMapper.toRequest(write)).pipe(
      map((response) => TariffMapper.fromResponse(response, equipmentTypes, pricingTypes)),
      switchMap((created) => {
        this._currentPage.set(0);
        return this.load().pipe(
          map(() => created),
          defaultIfEmpty(created),
        );
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  update(id: number, write: TariffWrite): Observable<Tariff> {
    this._saving.set(true);
    const equipmentTypes = this.equipmentTypeStore.types();
    const pricingTypes = this.pricingTypeStore.pricingTypes();
    return this.service.updateTariff(id, TariffMapper.toRequest(write)).pipe(
      map((response) => TariffMapper.fromResponse(response, equipmentTypes, pricingTypes)),
      tap((updated) => {
        this._tariffs.set(this._tariffs().map((t) => (t.id === updated.id ? updated : t)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  activate(id: number): Observable<Tariff> {
    this._saving.set(true);
    const equipmentTypes = this.equipmentTypeStore.types();
    const pricingTypes = this.pricingTypeStore.pricingTypes();
    return this.service.activateTariff(id).pipe(
      map((response) => TariffMapper.fromResponse(response, equipmentTypes, pricingTypes)),
      tap((activated) => {
        this._tariffs.set(this._tariffs().map((t) => (t.id === activated.id ? activated : t)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  deactivate(id: number): Observable<Tariff> {
    this._saving.set(true);
    const equipmentTypes = this.equipmentTypeStore.types();
    const pricingTypes = this.pricingTypeStore.pricingTypes();
    return this.service.deactivateTariff(id).pipe(
      map((response) => TariffMapper.fromResponse(response, equipmentTypes, pricingTypes)),
      tap((deactivated) => {
        this._tariffs.set(this._tariffs().map((t) => (t.id === deactivated.id ? deactivated : t)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  resolveSpecialTariff(): Observable<void> {
    const specialType = this.equipmentTypeStore.types().find((t) => t.isForSpecialTariff);
    if (!specialType) {
      return EMPTY;
    }
    const equipmentTypes = this.equipmentTypeStore.types();
    const pricingTypes = this.pricingTypeStore.pricingTypes();
    return this.service.getActiveTariffs(specialType.slug).pipe(
      tap((responses) => {
        const specialTariff = responses
          .map((r) => TariffMapper.fromResponse(r, equipmentTypes, pricingTypes))
          .find((t) => t.isSpecial);
        this._specialTariffId.set(specialTariff?.id ?? null);
      }),
      map(() => undefined),
      catchError(() => EMPTY),
    );
  }

  calculateCost(request: CostCalculationV2Request): Observable<CostCalculationResponse> {
    return this.service.costCalculations(request);
  }

  createQuote(request: CostCalculationV2Request): Observable<CostQuoteResponse> {
    return this.service.createQuote(request, 'body', { context: suppressErrorNotification() });
  }

  deleteQuote(quoteId: string): Observable<void> {
    return this.service
      .deleteQuote(quoteId, 'body', { context: suppressErrorNotification() })
      .pipe(map(() => undefined as void));
  }
}
