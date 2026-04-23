import { inject, Injectable } from '@angular/core';
import { catchError, finalize, forkJoin, of, tap } from 'rxjs';
import { EquipmentStatusStore } from './equipment-status.store';
import { EquipmentTypeStore } from './equipment-type.store';
import { PricingTypeStore } from './pricing-type.store';
import { LookupConfig } from '../models/lookup-config.model';

@Injectable({ providedIn: 'root' })
export class LookupInitializerFacade {
  private readonly equipmentStatusStore = inject(EquipmentStatusStore);
  private readonly equipmentTypeStore = inject(EquipmentTypeStore);
  private readonly pricingTypeStore = inject(PricingTypeStore);

  init(config: LookupConfig) {
    console.log('Background initialization started...');
    const tasks = [];

    if (config.loadEquipmentStatus) {
      tasks.push(
        this.equipmentStatusStore.load().pipe(
          catchError((err) => {
            console.error('Failed to load equipment status', err);
            return of(null);
          }),
        ),
      );
    }

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

    return forkJoin(tasks).pipe(
      tap(() => console.log('Lookup initialization started...')),
      finalize(() => console.log('Lookup initialization finished.')),
    );
  }
}
