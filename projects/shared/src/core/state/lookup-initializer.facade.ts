import { inject, Injectable } from '@angular/core';
import { catchError, finalize, forkJoin, Observable, of, switchMap, tap } from 'rxjs';
import { EquipmentTypeStore } from './equipment-type.store';
import { PricingTypeStore } from './pricing-type.store';
import { TariffStore } from './tariff.store';
import { LookupConfig } from '../models/lookup-config.model';

@Injectable({ providedIn: 'root' })
export class LookupInitializerFacade {
  private readonly equipmentTypeStore = inject(EquipmentTypeStore);
  private readonly pricingTypeStore = inject(PricingTypeStore);
  private readonly tariffStore = inject(TariffStore);

  init(config: LookupConfig): Observable<unknown> {
    console.log('Background initialization started...');
    const tasks: Observable<unknown>[] = [];

    if (config.loadEquipmentType) {
      tasks.push(
        this.equipmentTypeStore.load().pipe(
          catchError((err) => {
            console.error('Failed to load equipment types', err);
            return of(null);
          }),
        ),
      );
    }

    if (config.loadPricingType) {
      tasks.push(
        this.pricingTypeStore.load().pipe(
          catchError((err) => {
            console.error('Failed to load pricing types', err);
            return of(null);
          }),
        ),
      );
    }

    const pipeline = forkJoin(tasks).pipe(
      tap(() => console.log('Lookup initialization started...')),
      finalize(() => console.log('Lookup initialization finished.')),
    );

    if (config.loadSpecialTariffId) {
      return pipeline.pipe(
        switchMap(() => this.tariffStore.resolveSpecialTariff()),
        catchError(() => of(null)),
      );
    }

    return pipeline;
  }
}
