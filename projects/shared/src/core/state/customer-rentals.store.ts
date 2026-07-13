import { inject, Injectable, signal } from '@angular/core';
import { catchError, finalize, map, Observable, of, switchMap } from 'rxjs';
import type { CustomerRentalSummary } from '@ui-models';
import type { PageRentalSummaryResponse } from '@api-models';
import * as api from '../api/generated';
import { RentalMapper } from '../mappers/rental.mapper';
import { toIsoDate } from '../../shared/utils/date.util';
import { suppressErrorNotification } from '../errors/http-error-context';
import { CustomerLayoutStore } from './customer-layout.store';

const PAGE_SIZE = 10;

@Injectable()
export class CustomerRentalsStore {
  private readonly rentalsService = inject(api.RentalsService);
  private readonly equipmentsService = inject(api.EquipmentsCatalogueService);
  private readonly layoutStore = inject(CustomerLayoutStore);

  readonly rentals = signal<CustomerRentalSummary[]>([]);
  readonly totalItems = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(PAGE_SIZE);
  readonly loading = signal(false);
  readonly error = signal(false);

  private currentFrom?: Date;
  private currentTo?: Date;

  load(from: Date | undefined, to: Date | undefined, page: number): void {
    this.currentFrom = from;
    this.currentTo = to;
    this.fetch(from, to, page);
  }

  reload(): void {
    this.fetch(this.currentFrom, this.currentTo, this.pageIndex());
  }

  private fetch(from: Date | undefined, to: Date | undefined, page: number): void {
    const customerId = this.layoutStore.customerId();
    if (!customerId) return;

    this.loading.set(true);
    this.error.set(false);

    this.rentalsService
      .getRentals(
        { page, size: PAGE_SIZE },
        undefined,
        customerId,
        undefined,
        from ? toIsoDate(from) : undefined,
        to ? toIsoDate(to) : undefined,
      )
      .pipe(
        switchMap((response) => this.withEquipmentNames(response)),
        catchError(() => {
          this.error.set(true);
          return of(null);
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((result) => {
        if (!result) return;
        this.rentals.set(result.items);
        this.totalItems.set(result.total);
        this.pageIndex.set(page);
      });
  }

  private withEquipmentNames(
    response: PageRentalSummaryResponse,
  ): Observable<{ items: CustomerRentalSummary[]; total: number }> {
    const items = (response.items ?? []).map((r) => RentalMapper.fromRentalSummary(r));
    const total = response.totalItems ?? 0;

    const ids = [...new Set(items.flatMap((r) => r.equipment.map((e) => e.id)))];
    if (ids.length === 0) return of({ items, total });

    return this.equipmentsService
      .getBatchEquipments(ids, 'body', { context: suppressErrorNotification() })
      .pipe(
        map((equipments) => {
          const nameMap = new Map(equipments.map((e) => [e.id, e.model]));
          const enriched = items.map((r) => ({
            ...r,
            equipment: r.equipment.map((e) => ({ ...e, name: nameMap.get(e.id) ?? '' })),
          }));
          return { items: enriched, total };
        }),
        catchError(() => of({ items, total })),
      );
  }
}
