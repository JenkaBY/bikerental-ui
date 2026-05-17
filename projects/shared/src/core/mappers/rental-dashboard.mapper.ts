import type {
  CustomerResponse,
  EquipmentItemResponse,
  EquipmentResponse,
  RentalResponse,
  RentalSummaryResponse,
  ReturnEquipmentRequest,
} from '@api-models';
import type {
  BrokenEquipmentEntry,
  RentalDetailState,
  RentalEquipmentItem,
  RentalListItem,
  ReturnEquipmentWrite,
} from '@ui-models';
import { CustomerMapper } from './customer.mapper';
import { makeMoney } from './money.mapper';

export class RentalDashboardMapper {
  static toListItem(
    r: RentalSummaryResponse,
    customer: CustomerResponse | null,
    equipmentNameMap: Map<number, string>,
  ): RentalListItem {
    const isActive = r.status === 'ACTIVE';
    const isDebt = r.status === 'DEBT';
    const isOverdue = r.overdueMinutes != null && r.overdueMinutes > 0;
    const firstName = customer?.firstName ?? '';
    const lastName = customer?.lastName ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    return {
      id: r.id ?? 0,
      status: r.status ?? '',
      customerPhone: customer?.phone ?? '',
      customerName: fullName || undefined,
      startedAt: r.startedAt ? new Date(r.startedAt) : new Date(0),
      equipmentNames: (r.equipmentIds ?? []).map((id) => equipmentNameMap.get(id) ?? ''),
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      isActive,
      isDebt,
      isOverdue,
      overdueMinutes: isOverdue ? r.overdueMinutes : undefined,
    };
  }

  static toDetailState(
    r: RentalResponse,
    customer: CustomerResponse | null,
    equipmentBatch: EquipmentResponse[],
  ): Partial<RentalDetailState> {
    const isActive = r.status === 'ACTIVE';
    const isDebt = r.status === 'DEBT';
    const startedAt = r.startedAt ? new Date(r.startedAt) : null;
    const now = new Date();
    const isOverdue =
      isActive &&
      startedAt !== null &&
      r.plannedDurationMinutes != null &&
      new Date(startedAt.getTime() + r.plannedDurationMinutes * 60_000) < now;

    const equipmentMap = new Map<number, EquipmentResponse>(equipmentBatch.map((e) => [e.id, e]));
    const equipmentItems: RentalEquipmentItem[] = (r.equipmentItems ?? []).map(
      (item: EquipmentItemResponse) => {
        const eq = equipmentMap.get(item.equipmentId);
        return {
          id: item.equipmentId,
          uid: eq?.uid ?? item.equipmentUid ?? '',
          model: eq?.model ?? '',
          type: { slug: eq?.type ?? '', name: eq?.type ?? '', isForSpecialTariff: false },
          statusSlug: item.status,
          isReturned: item.status === 'RETURNED',
        };
      },
    );

    return {
      id: r.id,
      status: r.status,
      customerId: r.customerId,
      customer: customer ? CustomerMapper.fromResponse(customer) : null,
      equipmentItems,
      durationMinutes: r.plannedDurationMinutes,
      startedAt,
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      paidDurationMinutes: r.actualDurationMinutes,
      finalCost: r.finalCost !== undefined ? makeMoney(r.finalCost) : undefined,
      debtAmount: isDebt && r.finalCost !== undefined ? makeMoney(r.finalCost) : undefined,
      isActive,
      isDebt,
      isOverdue,
      brokenEquipmentEntries: [] as BrokenEquipmentEntry[],
      isReturning: false,
    };
  }

  static toReturnRequest(w: ReturnEquipmentWrite, operatorId: string): ReturnEquipmentRequest {
    return {
      rentalId: w.rentalId,
      equipmentIds: w.equipmentItemIds,
      operatorId,
    };
  }
}
