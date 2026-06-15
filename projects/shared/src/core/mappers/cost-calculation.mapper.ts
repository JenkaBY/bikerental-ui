import { inject, Injectable } from '@angular/core';
import type { CostCalculationRequest, CostCalculationResponse } from '@api-models';
import type { RentalCostEstimate, RentalDetailState, RentalState, RentalWrite } from '@ui-models';
import { makeMoney } from './money.mapper';
import { TimeStore } from '../state/time.store';

@Injectable({ providedIn: 'root' })
export class CostCalculationMapper {
  private readonly timeStore = inject(TimeStore);

  toRequest(draft: Partial<RentalWrite>, equipmentTypes: string[]): CostCalculationRequest {
    return {
      equipments: equipmentTypes.map((equipmentType) => ({ equipmentType })),
      plannedDurationMinutes: draft.durationMinutes ?? 0,
      ...(draft.discountPercent !== undefined && { discountPercent: draft.discountPercent }),
      ...(draft.specialTariffId !== undefined && { specialTariffId: draft.specialTariffId }),
      ...(draft.specialPrice !== undefined && { specialPrice: draft.specialPrice }),
    };
  }

  fromState(
    draft: RentalState | RentalDetailState,
    specialTariffId: number | null,
  ): CostCalculationRequest {
    const actualDuration =
      'startedAt' in draft && draft.startedAt
        ? Math.floor(
            (this.timeStore.getCurrentDate().getTime() - draft.startedAt.getTime()) / 60_000,
          )
        : undefined;
    return {
      equipments: draft.equipmentItems.map((e) => ({ equipmentType: e.type.slug })),
      plannedDurationMinutes: draft.durationMinutes,
      actualDurationMinutes: actualDuration,
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
