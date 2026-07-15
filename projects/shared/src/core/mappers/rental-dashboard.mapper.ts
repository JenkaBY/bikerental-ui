import type {
  ConfirmReturnRequest,
  CustomerResponse,
  EquipmentItemResponse,
  RentalResponse,
  RentalSummaryResponse,
  ReturnEquipmentRequest,
} from '@api-models';
import type {
  BrokenEquipmentEntry,
  Customer,
  EquipmentSearchItem,
  RentalEquipmentItem,
  RentalListItem,
  ReturnEquipmentWrite,
} from '@ui-models';
import type { RentalDetailState } from '../state/rental.state';
import { makeMoney } from './money.mapper';

export class RentalDashboardMapper {
  private static calculateOverdue(
    isActive: boolean,
    startedAt: Date | null,
    plannedDurationMinutes: number | null | undefined,
    now: Date = new Date(),
  ): { isOverdue: boolean; overdueMinutes?: number } {
    if (!isActive || startedAt === null || plannedDurationMinutes == null) {
      return { isOverdue: false };
    }

    const expectedReturnAt = new Date(startedAt.getTime() + plannedDurationMinutes * 60_000);
    const isOverdue = expectedReturnAt < now;

    if (isOverdue) {
      const overdueMinutes = (now.getTime() - expectedReturnAt.getTime()) / 60_000;
      return { isOverdue: true, overdueMinutes };
    }

    return { isOverdue: false };
  }

  static toListItem(
    r: RentalSummaryResponse,
    customer: CustomerResponse | null,
    equipmentNameMap: Map<number, string>,
    currentDate: Date = new Date(),
  ): RentalListItem {
    const isActive = r.status === 'ACTIVE';
    const isDebt = r.status === 'DEBT';
    const startedAt = r.startedAt ? new Date(r.startedAt) : new Date(0);
    const { isOverdue, overdueMinutes } = this.calculateOverdue(
      isActive,
      startedAt,
      r.plannedDurationMinutes,
      currentDate,
    );
    const firstName = customer?.firstName ?? '';
    const lastName = customer?.lastName ?? '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ');

    return {
      id: r.id ?? 0,
      status: r.status ?? '',
      customerPhone: customer?.phone ?? '',
      customerName: fullName || undefined,
      startedAt,
      equipment: (r.equipments ?? []).map((e) => ({
        uid: e.equipmentUid,
        name: equipmentNameMap.get(e.equipmentId) ?? '',
      })),
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      isActive,
      isDebt,
      isOverdue,
      overdueMinutes,
    };
  }

  static toDetailState(
    r: RentalResponse,
    customer: Customer | null,
    equipmentBatch: EquipmentSearchItem[],
  ): Partial<RentalDetailState> {
    const isActive = r.status === 'ACTIVE';
    const isDebt = r.status === 'DEBT';
    const startedAt = r.startedAt ? new Date(r.startedAt) : null;
    const { isOverdue, overdueMinutes } = this.calculateOverdue(
      isActive,
      startedAt,
      r.plannedDurationMinutes,
    );

    const equipmentMap = new Map<number, EquipmentSearchItem>(equipmentBatch.map((e) => [e.id, e]));
    const equipmentItems: RentalEquipmentItem[] = (r.equipmentItems ?? []).map(
      (item: EquipmentItemResponse) => {
        const eq = equipmentMap.get(item.equipmentId);
        return {
          id: item.equipmentId,
          uid: eq?.uid ?? item.equipmentUid ?? '',
          model: eq?.model ?? '',
          type: eq?.type ?? { slug: '', name: '', isForSpecialTariff: false },
          statusSlug: item.status,
          isReturned: item.status === 'RETURNED',
          estimatedCost: makeMoney(item.estimatedCost),
          finalCost: item.finalCost != null ? makeMoney(item.finalCost) : undefined,
          breakdown: item.breakdown
            ? {
                equipmentId: item.equipmentId,
                equipmentType: eq?.type?.slug ?? '',
                tariffId: item.tariffId ?? 0,
                itemCost: makeMoney(item.finalCost ?? item.breakdown.itemCost),
                breakdownPatternCode: item.breakdown.calculationBreakdown?.breakdownPatternCode,
                params: item.breakdown.calculationBreakdown?.params ?? null,
                calculationMessage: item.breakdown.calculationBreakdown?.message ?? '',
              }
            : undefined,
          returnedAt: item.actualReturnAt ? new Date(item.actualReturnAt) : undefined,
        };
      },
    );

    return {
      id: r.id,
      status: r.status,
      version: r.version,
      customerId: r.customerId,
      customer,
      equipmentItems,
      durationMinutes: r.plannedDurationMinutes,
      discountPercent: r.discountPercent,
      specialPrice: r.specialPrice,
      specialPriceEnabled: r.specialPrice != null,
      startedAt,
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      paidDurationMinutes: r.actualDurationMinutes,
      finalCost: r.finalCost !== undefined ? makeMoney(r.finalCost) : undefined,
      debtAmount: isDebt && r.finalCost !== undefined ? makeMoney(r.finalCost) : undefined,
      isActive,
      isDebt,
      isOverdue,
      overdueMinutes,
      brokenEquipmentEntries: [] as BrokenEquipmentEntry[],
      isReturning: false,
      estimatedCost: r.estimatedCost ? makeMoney(r.estimatedCost) : undefined,
    };
  }

  static toReturnRequest(w: ReturnEquipmentWrite, operatorId: string): ReturnEquipmentRequest {
    return {
      rentalId: w.rentalId,
      equipmentIds: w.equipmentItemIds,
      operatorId,
    };
  }

  static toConfirmReturnRequest(quoteId: string, operatorId: string): ConfirmReturnRequest {
    return { quoteId, operatorId };
  }
}
