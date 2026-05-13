import type {
  CostCalculationRequest,
  CostCalculationResponse,
  RentalRequest,
  RentalSummaryResponse,
} from '@api-models';
import { type CustomerRentalSummary, type RentalCostEstimate, type RentalWrite } from '@ui-models';
import { makeMoney } from './money.mapper';

export class RentalMapper {
  static fromRentalSummary(r: RentalSummaryResponse): CustomerRentalSummary {
    return {
      id: r.id ?? 0,
      status: r.status ?? '',
      startedAt: r.startedAt ? new Date(r.startedAt) : new Date(0),
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      estimatedCost: makeMoney(0),
      equipmentIds: r.equipmentIds ?? [],
    };
  }

  static toRentalRequest(draft: RentalWrite): RentalRequest {
    return {
      customerId: draft.customerId,
      equipmentIds: draft.equipmentIds,
      duration: draft.durationMinutes,
      operatorId: draft.operatorId,
      ...(draft.discountPercent !== undefined && { discountPercent: draft.discountPercent }),
      ...(draft.specialTariffId !== undefined && { specialTariffId: draft.specialTariffId }),
      ...(draft.specialPrice !== undefined && { specialPrice: draft.specialPrice }),
    };
  }

  static toCostCalculationRequest(
    draft: Partial<RentalWrite>,
    equipmentTypes: string[],
  ): CostCalculationRequest {
    return {
      equipments: equipmentTypes.map((equipmentType) => ({ equipmentType })),
      plannedDurationMinutes: draft.durationMinutes ?? 0,
      ...(draft.discountPercent !== undefined && { discountPercent: draft.discountPercent }),
      ...(draft.specialTariffId !== undefined && { specialTariffId: draft.specialTariffId }),
      ...(draft.specialPrice !== undefined && { specialPrice: draft.specialPrice }),
    };
  }

  static fromCostResponse(response: CostCalculationResponse): RentalCostEstimate {
    return {
      subtotal: makeMoney(response.subtotal),
      totalCost: makeMoney(response.totalCost),
      specialPricingApplied: response.specialPricingApplied ?? false,
      discountPercent: response.discount?.percent,
      discountAmount: makeMoney(response.discount?.amount ?? 0),
      equipmentBreakdowns: response.equipmentBreakdowns.map((b) => ({
        equipmentType: b.equipmentType,
        tariffId: b.tariffId,
        itemCost: makeMoney(b.itemCost),
      })),
    };
  }
}
