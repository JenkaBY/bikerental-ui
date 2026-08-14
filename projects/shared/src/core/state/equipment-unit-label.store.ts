import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, tap } from 'rxjs/operators';
import { EquipmentsCatalogueService } from '../api/generated';

@Injectable({ providedIn: 'root' })
export class EquipmentUnitLabelStore {
  private readonly equipmentsCatalogueService = inject(EquipmentsCatalogueService);

  private readonly _loading = signal(false);
  readonly loading = computed(() => this._loading());

  private readonly labels = signal<ReadonlyMap<string, string>>(new Map());

  ensure(ids: readonly number[]): Observable<void> {
    const cache = this.labels();
    const missingIds = ids.filter((id) => Number.isFinite(id) && !cache.has(String(id)));

    if (missingIds.length === 0) return of(undefined);

    this._loading.set(true);
    return this.equipmentsCatalogueService.getBatchEquipments(missingIds, 'body').pipe(
      tap((items) => {
        const next = new Map(this.labels());
        for (const item of items) {
          const label = item.model ? `${item.uid} — ${item.model}` : item.uid;
          next.set(String(item.id), label);
        }
        this.labels.set(next);
      }),
      map(() => undefined),
      catchError(() => of(undefined)),
      finalize(() => this._loading.set(false)),
    );
  }

  labelFor(id: string): string {
    return this.labels().get(id) ?? id;
  }
}
