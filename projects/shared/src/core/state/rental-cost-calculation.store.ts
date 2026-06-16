import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import type { CostCalculationV2Request } from '@api-models';
import type {
  Money,
  RentalCostBreakdown,
  RentalCostEstimate,
  RentalEquipmentItem,
} from '@ui-models';
import { CostCalculationMapper } from '../mappers/cost-calculation.mapper';
import { makeMoney } from '../mappers/money.mapper';
import { TariffStore } from './tariff.store';
import { RentalStore } from './rental.store';

@Injectable()
export class RentalCostCalculationStore {
  private readonly tariffStore = inject(TariffStore);
  private readonly rentalStore = inject(RentalStore);
  private readonly costCalculationMapper = inject(CostCalculationMapper);

  readonly activeItems = computed<RentalEquipmentItem[]>(() =>
    this.rentalStore.rentalEquipmentItems().filter((item) => !item.isReturned),
  );

  readonly returnedItems = computed<RentalEquipmentItem[]>(() =>
    this.rentalStore.rentalEquipmentItems().filter((item) => item.isReturned),
  );

  private readonly calculationRequest = computed(() => {
    const s = this.rentalStore.state();
    const active = this.activeItems();
    if (active.length === 0) return null;
    if (s.specialPriceEnabled && !s.specialPrice) return null;
    return this.costCalculationMapper.fromState(
      { ...s, equipmentItems: active },
      this.tariffStore.specialTariffId(),
    );
  });

  readonly resource = rxResource<RentalCostEstimate | null, CostCalculationV2Request | null>({
    params: () => this.calculationRequest(),
    stream: ({ params }: { params: CostCalculationV2Request | null }) => {
      if (!params) return of(null);
      return timer(300).pipe(
        switchMap(() => this.tariffStore.calculateCost(params)),
        map((res) => this.costCalculationMapper.fromResponse(res)),
        catchError(() => of(null)),
      );
    },
  });

  readonly estimate = computed(() => this.resource.value());
  readonly isCalculating = this.resource.isLoading;

  readonly hasActiveItems = computed(() => this.activeItems().length > 0);
  readonly isFinal = computed(() => !this.hasActiveItems());

  private readonly returnedBreakdowns = computed<RentalCostBreakdown[]>(() =>
    this.returnedItems()
      .map((item) => item.breakdown)
      .filter((b): b is RentalCostBreakdown => b != null),
  );

  readonly breakdowns = computed<RentalCostBreakdown[]>(() => [
    ...this.returnedBreakdowns(),
    ...(this.estimate()?.equipmentBreakdowns ?? []),
  ]);

  private readonly returnedTotal = computed<Money>(() => {
    const items = this.returnedItems();
    const sum = items.reduce((acc, item) => acc + (item.finalCost?.amount ?? 0), 0);
    return makeMoney(sum, items[0]?.finalCost?.currency);
  });

  readonly totalCost = computed<Money | null>(() => {
    const estimate = this.estimate();
    const returned = this.returnedTotal();
    if (this.hasActiveItems()) {
      if (!estimate) return null;
      return makeMoney(returned.amount + estimate.totalCost.amount, estimate.totalCost.currency);
    }
    if (this.returnedItems().length === 0) return null;
    return returned;
  });
}
