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
import { FinanceService } from '../api/generated';
import { CostCalculationMapper } from '../mappers/cost-calculation.mapper';
import { makeMoney } from '../mappers/money.mapper';
import { toIsoDate } from '../../shared/utils/date.util';
import { TariffStore } from './tariff.store';
import { RentalStore } from './rental.store';

interface HeldAmountParams {
  rentalId: number;
  customerId: string;
  startedAt: Date | null;
}

@Injectable()
export class ReturnEquipmentCostStore {
  private readonly tariffStore = inject(TariffStore);
  private readonly rentalStore = inject(RentalStore);
  private readonly costCalculationMapper = inject(CostCalculationMapper);
  private readonly financeService = inject(FinanceService);

  readonly selectedItems = computed<RentalEquipmentItem[]>(() => {
    const selectedIds = this.rentalStore.selectedEquipmentItemIds();
    return this.rentalStore.rentalEquipmentItems().filter((item) => selectedIds.has(item.id));
  });

  private readonly calculationRequest = computed<CostCalculationV2Request | null>(() => {
    const s = this.rentalStore.state();
    const selected = this.selectedItems();
    if (selected.length === 0) return null;
    return this.costCalculationMapper.fromState(
      { ...s, equipmentItems: selected, specialPriceEnabled: false, specialPrice: undefined },
      null,
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

  readonly estimate = computed(() => this.resource.value() ?? null);
  readonly isCalculating = this.resource.isLoading;

  readonly breakdownByEquipmentId = computed<Map<number, RentalCostBreakdown>>(() => {
    const map = new Map<number, RentalCostBreakdown>();
    for (const breakdown of this.estimate()?.equipmentBreakdowns ?? []) {
      if (breakdown.equipmentId != null) map.set(breakdown.equipmentId, breakdown);
    }
    return map;
  });

  readonly totalCurrent = computed<Money | null>(() => this.estimate()?.totalCost ?? null);

  private readonly heldAmountParams = computed<HeldAmountParams | null>(() => {
    const rentalId = this.rentalStore.id();
    const customerId = this.rentalStore.customerId();
    if (rentalId === null || !customerId) return null;
    return { rentalId, customerId, startedAt: this.rentalStore.startedAt() };
  });

  private readonly heldAmountResource = rxResource<Money | null, HeldAmountParams | null>({
    params: () => this.heldAmountParams(),
    stream: ({ params }: { params: HeldAmountParams | null }) => {
      if (!params) return of(null);
      const fromDate = toIsoDate(params.startedAt ?? new Date(0));
      const toDate = toIsoDate(new Date());
      return this.financeService
        .getTransactionHistory(
          params.customerId,
          { fromDate, toDate, sourceId: String(params.rentalId), sourceType: 'RENTAL' },
          { page: 0, size: 100 },
        )
        .pipe(
          map((page) => {
            const holdTotal = (page.items ?? [])
              .filter((t) => t.type === 'HOLD')
              .reduce((sum, t) => sum + t.amount, 0);
            return makeMoney(holdTotal);
          }),
          catchError(() => of(null)),
        );
    },
  });

  // The rental-scoped HOLD transaction from the ledger — the amount actually reserved
  // for this specific rental (not the customer's account-wide reserved balance).
  readonly heldAmount = computed<Money | null>(() => this.heldAmountResource.value() ?? null);

  readonly settlement = computed<ReturnSettlement | null>(() => {
    const current = this.totalCurrent();
    const held = this.heldAmount();
    if (!current || !held) return null;
    const diff = held.amount - current.amount;
    const amount = makeMoney(Math.abs(diff), current.currency);
    if (diff > 0) return { kind: 'refund', amount };
    if (diff < 0) return { kind: 'collect', amount };
    return { kind: 'none', amount };
  });
}
