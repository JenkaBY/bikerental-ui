import type { RentalSummaryResponse } from '@api-models';
import { type CustomerRentalSummary } from '@ui-models';
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
}
