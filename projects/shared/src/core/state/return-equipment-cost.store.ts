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
  ReturnSettlement,
} from '@ui-models';
import { CostCalculationMapper } from '../mappers/cost-calculation.mapper';
import { makeMoney } from '../mappers/money.mapper';
import { TariffStore } from './tariff.store';
import { RentalStore } from './rental.store';

@Injectable()
export class ReturnEquipmentCostStore {
  private readonly tariffStore = inject(TariffStore);
  private readonly rentalStore = inject(RentalStore);
  private readonly costCalculationMapper = inject(CostCalculationMapper);

  readonly selectedItems = computed<RentalEquipmentItem[]>(() => {
    const selectedIds = this.rentalStore.selectedEquipmentItemIds();
    return this.rentalStore.rentalEquipmentItems().filter((item) => selectedIds.has(item.id));
  });

  private readonly calculationRequest = computed(() => {
    const s = this.rentalStore.state();
    const selected = this.selectedItems();
    if (selected.length === 0) return null;
    if (s.specialPriceEnabled && !s.specialPrice) return null;
    return this.costCalculationMapper.fromState(
      { ...s, equipmentItems: selected },
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

  readonly breakdownByEquipmentId = computed<Map<number, RentalCostBreakdown>>(() => {
    const map = new Map<number, RentalCostBreakdown>();
    for (const breakdown of this.estimate()?.equipmentBreakdowns ?? []) {
      if (breakdown.equipmentId != null) map.set(breakdown.equipmentId, breakdown);
    }
    return map;
  });

  readonly totalEstimated = computed<Money>(() => {
    const items = this.selectedItems();
    const sum = items.reduce((acc, item) => acc + item.estimatedCost.amount, 0);
    return makeMoney(sum, items[0]?.estimatedCost.currency);
  });

  readonly totalCurrent = computed<Money | null>(() => this.estimate()?.totalCost ?? null);

  readonly settlement = computed<ReturnSettlement | null>(() => {
    const current = this.totalCurrent();
    if (!current) return null;
    const diff = this.totalEstimated().amount - current.amount;
    const amount = makeMoney(Math.abs(diff), current.currency);
    if (diff > 0) return { kind: 'refund', amount };
    if (diff < 0) return { kind: 'collect', amount };
    return { kind: 'none', amount };
  });
}
