import type { EquipmentSearchItem, RentalCostBreakdown, RentalEquipmentItem } from '@ui-models';
import { minutesBetween } from '../../shared/utils/date.util';
import type { EquipmentUnitViewModel } from '../../shared/components/equipment-unit/equipment-unit-card.component';

export class EquipmentUnitViewModelMapper {
  static forSearchItem(
    item: EquipmentSearchItem,
    breakdown: RentalCostBreakdown | null,
    plannedDurationMinutes: number | null,
  ): EquipmentUnitViewModel {
    const price = breakdown?.itemCost ?? null;
    return {
      uid: item.uid,
      name: item.model || item.type.name,
      price,
      priceKind: 'estimated',
      plannedCost: price,
      plannedDurationMinutes,
      breakdown,
    };
  }

  static forRentalItem(
    item: RentalEquipmentItem,
    breakdown: RentalCostBreakdown | null,
    rentalStartedAt: Date | null,
    plannedDurationMinutes: number | null,
    now: Date,
  ): EquipmentUnitViewModel {
    const startedAt = item.startedAt ?? rentalStartedAt;
    return {
      uid: item.uid,
      name: item.model || item.type.name,
      statusSlug: item.isReturned ? 'RETURNED' : item.statusSlug,
      price: item.isReturned ? (item.finalCost ?? null) : (breakdown?.itemCost ?? null),
      priceKind: item.isReturned ? 'final' : 'current',
      plannedCost: item.estimatedCost,
      breakdown,
      plannedDurationMinutes,
      startedAt,
      actualReturnedAt: item.returnedAt ?? null,
      actualDurationMinutes: item.isReturned
        ? minutesBetween(startedAt, item.returnedAt ?? null)
        : null,
      currentDurationMinutes: item.isReturned ? null : minutesBetween(startedAt, now),
    };
  }
}
