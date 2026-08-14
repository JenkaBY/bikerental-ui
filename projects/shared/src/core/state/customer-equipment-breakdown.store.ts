import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AnalyticsService, CustomersService } from '../api/generated';
import type { ApiError } from '../errors/api-error.model';
import { ApiErrorParser } from '../errors/api-error.parser';
import { suppressErrorNotification } from '../errors/http-error-context';
import { AnalyticsCustomerMapper } from '../mappers/analytics-customer.mapper';
import type {
  CustomerAnalyticsRange,
  CustomerEquipmentBreakdown,
  CustomerEquipmentTypeRow,
  CustomerRef,
  RevenueMetrics,
} from '@ui-models';
import { toIsoDate } from '../../shared/utils/date.util';
import { EquipmentTypeStore } from './equipment-type.store';
import { EquipmentUnitLabelStore } from './equipment-unit-label.store';

interface BreakdownParams {
  readonly range: CustomerAnalyticsRange;
  readonly customerId: string;
}

interface BreakdownLoad {
  readonly breakdown: CustomerEquipmentBreakdown | null;
  readonly customer: CustomerRef | undefined;
  readonly error: ApiError | null;
}

const EMPTY_LOAD: BreakdownLoad = { breakdown: null, customer: undefined, error: null };

function sameBreakdownRange(
  a: CustomerAnalyticsRange | null,
  b: CustomerAnalyticsRange | null,
): boolean {
  return (
    a?.from.getTime() === b?.from.getTime() &&
    a?.to.getTime() === b?.to.getTime() &&
    a?.operatorId === b?.operatorId
  );
}

@Injectable()
export class CustomerEquipmentBreakdownStore {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly customersService = inject(CustomersService);
  private readonly equipmentTypeStore = inject(EquipmentTypeStore);
  private readonly unitLabels = inject(EquipmentUnitLabelStore);

  private readonly _range = signal<CustomerAnalyticsRange | null>(null, {
    equal: sameBreakdownRange,
  });
  private readonly _customerId = signal<string | undefined>(undefined);

  private readonly resource = rxResource<BreakdownLoad, BreakdownParams | null>({
    params: () => {
      const range = this._range();
      const customerId = this._customerId();
      return range && customerId ? { range, customerId } : null;
    },
    stream: ({ params }) => {
      if (!params) return of(EMPTY_LOAD);
      return forkJoin({
        breakdown: this.analyticsService
          .getCustomerEquipmentBreakdown(
            params.customerId,
            {
              from: toIsoDate(params.range.from),
              to: toIsoDate(params.range.to),
              operatorId: params.range.operatorId,
            },
            'body',
            { context: suppressErrorNotification() },
          )
          .pipe(map(AnalyticsCustomerMapper.breakdownFromResponse)),
        customer: this.customersService
          .getCustomersBatch([params.customerId], 'body', { context: suppressErrorNotification() })
          .pipe(
            map((customers): CustomerRef | undefined => {
              const c = customers[0];
              return c
                ? {
                    id: c.id,
                    phone: c.phone,
                    name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || undefined,
                  }
                : undefined;
            }),
            catchError(() => of(undefined)),
          ),
      }).pipe(
        switchMap(({ breakdown, customer }) =>
          this.unitLabels
            .ensure(this.idsFrom(breakdown))
            .pipe(map((): BreakdownLoad => ({ breakdown, customer, error: null }))),
        ),
        catchError((err: unknown) =>
          of<BreakdownLoad>({
            breakdown: null,
            customer: undefined,
            error: ApiErrorParser.parse(err),
          }),
        ),
      );
    },
  });

  readonly breakdown = computed(() => this.resource.value()?.breakdown ?? null);
  readonly types = computed<readonly CustomerEquipmentTypeRow[]>(
    () => this.breakdown()?.types ?? [],
  );
  readonly totals = computed<RevenueMetrics | null>(() => this.breakdown()?.totals ?? null);
  readonly customer = computed(() => this.resource.value()?.customer);
  readonly loading = this.resource.isLoading;
  readonly error = computed<ApiError | null>(() => this.resource.value()?.error ?? null);
  readonly isEmpty = computed(() => !this.loading() && !this.error() && this.types().length === 0);

  constructor() {
    effect(() => {
      if (this.equipmentTypeStore.types().length === 0 && !this.equipmentTypeStore.loading()) {
        this.equipmentTypeStore.load().subscribe();
      }
    });
  }

  setRange(range: CustomerAnalyticsRange): void {
    this._range.set(range);
  }

  setCustomerId(customerId: string): void {
    this._customerId.set(customerId);
  }

  reload(): void {
    this.resource.reload();
  }

  typeNameFor(slug: string): string {
    const type = this.equipmentTypeStore.types().find((t) => t.slug === slug);
    return type ? type.name || type.slug : slug;
  }

  unitNameFor(id: string): string {
    return this.unitLabels.labelFor(id);
  }

  private idsFrom(breakdown: CustomerEquipmentBreakdown): number[] {
    const ids = new Set<number>();
    for (const type of breakdown.types) {
      for (const unit of type.units) {
        const id = Number(unit.equipmentId);
        if (Number.isFinite(id)) ids.add(id);
      }
    }
    return [...ids];
  }
}
