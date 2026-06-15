import { inject, Injectable } from '@angular/core';
import type { CostCalculationV2Request, CostCalculationResponse } from '@api-models';
import type { RentalCostEstimate } from '@ui-models';
import type { RentalDetailState, RentalState } from '../state/rental.state';
import { makeMoney } from './money.mapper';
import { TIME_TRAVEL_STORE_TOKEN } from '../state/time-travel-store.token';

@Injectable({ providedIn: 'root' })
export class CostCalculationMapper {
  private readonly timeTravelStore = inject(TIME_TRAVEL_STORE_TOKEN, { optional: true });

  fromState(
    draft: RentalState | RentalDetailState,
    specialTariffId: number | null,
  ): CostCalculationV2Request {
    const startedAt = 'startedAt' in draft ? draft.startedAt : null;
    const now = this.timeTravelStore?.getCurrentTime() ?? new Date();
    const returnAt = startedAt ? now.toISOString() : undefined;
    return {
      equipments: draft.equipmentItems.map((e) => ({
        equipmentId: e.id,
        equipmentType: e.type.slug,
        returnAt,
      })),
      startAt: (startedAt ?? now).toISOString(),
      plannedDurationMinutes: draft.durationMinutes,
      discountPercent: draft.specialPriceEnabled ? undefined : draft.discountPercent,
      specialPrice: draft.specialPriceEnabled ? draft.specialPrice : undefined,
      specialTariffId: draft.specialPriceEnabled ? (specialTariffId ?? undefined) : undefined,
    };
  }

  fromResponse(response: CostCalculationResponse): RentalCostEstimate {
    return {
      subtotal: makeMoney(response.subtotal),
      totalCost: makeMoney(response.totalCost),
      specialPricingApplied: response.specialPricingApplied ?? false,
      isEstimate: response.estimate ?? true,
      discountPercent: response.discount?.percent,
      discountAmount: makeMoney(response.discount?.amount ?? 0),
      equipmentBreakdowns: response.equipmentBreakdowns.map((b) => ({
        equipmentType: b.equipmentType,
        tariffId: b.tariffId,
        itemCost: makeMoney(b.itemCost),
        calculationMessage: b.calculationBreakdown?.message ?? '',
      })),
    };
  }
}
