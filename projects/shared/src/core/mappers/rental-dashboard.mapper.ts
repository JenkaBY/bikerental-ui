import type {
  ConfirmReturnRequest,
  CustomerResponse,
  EquipmentItemResponse,
  RentalPricingRequest,
  RentalResponse,
  RentalSummaryResponse,
  ReturnEquipmentRequest,
} from '@api-models';
import type {
  Customer,
  EquipmentSearchItem,
  Money,
  RentalEquipmentItem,
  RentalListItem,
  RentalPricingDraft,
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

  private static resolveDebtAmount(r: RentalResponse): Money | undefined {
    if (r.payableAmount !== undefined) return makeMoney(r.payableAmount);
    return r.finalCost !== undefined ? makeMoney(r.finalCost) : undefined;
  }

  static toRentalEquipmentItems(
    r: RentalResponse,
    equipmentBatch: EquipmentSearchItem[],
  ): RentalEquipmentItem[] {
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
                tariffCode: item.breakdown.calculationBreakdown?.tariffCode ?? null,
                pricingType: item.breakdown.pricingType,
                params: item.breakdown.calculationBreakdown?.params ?? null,
                calculationMessage: item.breakdown.calculationBreakdown?.message ?? '',
              }
            : undefined,
          returnedAt: item.actualReturnAt ? new Date(item.actualReturnAt) : undefined,
          startedAt: item.startedAt ? new Date(item.startedAt) : undefined,
        };
      },
    );

    return equipmentItems;
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

    const equipmentItems = this.toRentalEquipmentItems(r, equipmentBatch);
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
      specialTariffId: r.specialTariffId,
      priceMode: r.specialPrice != null ? 'FIXED' : r.discountPercent != null ? 'DISCOUNT' : 'FULL',
      startedAt,
      createdAt: r.createdAt ? new Date(r.createdAt) : undefined,
      expectedReturnAt: r.expectedReturnAt ? new Date(r.expectedReturnAt) : undefined,
      actualReturnAt: r.actualReturnAt ? new Date(r.actualReturnAt) : undefined,
      paidDurationMinutes: r.actualDurationMinutes,
      finalCost: r.finalCost !== undefined ? makeMoney(r.finalCost) : undefined,
      payableAmount: r.payableAmount !== undefined ? makeMoney(r.payableAmount) : undefined,
      debtAmount: isDebt ? this.resolveDebtAmount(r) : undefined,
      writtenOffAmount: r.writtenOffAmount ? makeMoney(r.writtenOffAmount) : undefined,
      isActive,
      isDebt,
      isOverdue,
      overdueMinutes,
      isReturning: false,
      isUpdatingPricing: false,
      estimatedCost: r.estimatedCost ? makeMoney(r.estimatedCost) : undefined,
    };
  }

  static toReturnRequest(w: ReturnEquipmentWrite): ReturnEquipmentRequest {
    return {
      rentalId: w.rentalId,
      equipmentIds: w.equipmentItemIds,
    };
  }

  static toConfirmReturnRequest(quoteId: string): ConfirmReturnRequest {
    return { quoteId };
  }

  static toPricingRequest(
    draft: RentalPricingDraft,
    specialTariffId: number | null,
  ): RentalPricingRequest {
    switch (draft.mode) {
      case 'DISCOUNT':
        return { discountPercent: draft.discountPercent ?? 0 };
      case 'FIXED':
        return {
          specialPrice: draft.specialPrice ?? 0,
          specialTariffId: specialTariffId ?? undefined,
        };
      case 'FULL':
      default:
        return {};
    }
  }
}
