import { computed, inject, Injectable, signal } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { PricingType } from '@ui-models';
import { TariffsService } from '../api/generated';
import { PricingTypeMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class PricingTypeStore {
  private service = inject(TariffsService);

  private readonly _pricingTypes = signal<PricingType[]>([]);
  private readonly _loading = signal(false);

  readonly pricingTypes = computed(() => this._pricingTypes());
  readonly loading = computed(() => this._loading());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.getPricingTypes().pipe(
      map((responses) => (responses ?? []).map(PricingTypeMapper.fromResponse)),
      tap((pricingTypes) => this._pricingTypes.set(pricingTypes)),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
      catchError(() => EMPTY),
    );
  }
}
