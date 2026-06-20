import type { RentalRequest, RentalSummaryResponse } from '@api-models';
import type { CustomerRentalSummary, RentalWrite } from '@ui-models';
import { makeMoney } from './money.mapper';

export class RentalMapper {
  static fromRentalSummary(r: RentalSummaryResponse): CustomerRentalSummary {
    return {
      id: r.id ?? 0,
      status: r.status ?? '',
      startedAt: r.startedAt ? new Date(r.startedAt) : new Date(0),
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      estimatedCost: makeMoney(0),
      equipmentIds: (r.equipments ?? []).map((e) => e.equipmentId),
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
}
