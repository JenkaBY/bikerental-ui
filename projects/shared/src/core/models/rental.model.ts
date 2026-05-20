import type { Money } from './transaction.model';
import { Labels } from '../../shared/constant/labels';

export interface CustomerRentalSummary {
  readonly id: number;
  readonly status: string;
  readonly startedAt: Date;
  readonly expectedReturnAt?: Date;
  readonly estimatedCost: Money;
  readonly equipmentIds: number[];
}

export interface RentalStatusMeta {
  readonly slug: string;
  readonly color: 'primary' | 'accent' | 'warn' | 'default';
  readonly labelKey: string;
  readonly label: string;
  readonly badgeClasses: string;
}

export interface EquipmentItemStatusMeta {
  readonly slug: string;
  readonly color: 'primary' | 'accent' | 'warn' | 'default';
  readonly labelKey: string;
  readonly label: string;
}

export const RentalStatus: Record<string, RentalStatusMeta> = {
  DRAFT: {
    slug: 'DRAFT',
    color: 'default',
    labelKey: 'rentalStatus.draft',
    label: Labels.RentalStatusDraft,
    badgeClasses: 'bg-gray-100 text-gray-600',
  },
  ACTIVE: {
    slug: 'ACTIVE',
    color: 'primary',
    labelKey: 'rentalStatus.active',
    label: Labels.RentalStatusActive,
    badgeClasses: 'bg-blue-100 text-blue-700',
  },
  COMPLETED: {
    slug: 'COMPLETED',
    color: 'default',
    labelKey: 'rentalStatus.completed',
    label: Labels.RentalStatusCompleted,
    badgeClasses: 'bg-gray-100 text-gray-600',
  },
  CANCELLED: {
    slug: 'CANCELLED',
    color: 'default',
    labelKey: 'rentalStatus.cancelled',
    label: Labels.RentalStatusCancelled,
    badgeClasses: 'bg-gray-100 text-gray-600',
  },
  DEBT: {
    slug: 'DEBT',
    color: 'warn',
    labelKey: 'rentalStatus.debt',
    label: Labels.RentalStatusDebt,
    badgeClasses: 'bg-amber-100 text-amber-700',
  },
};

export const EquipmentItemStatus: Record<string, EquipmentItemStatusMeta> = {
  ASSIGNED: {
    slug: 'ASSIGNED',
    color: 'primary',
    labelKey: 'equipmentItemStatus.assigned',
    label: Labels.EquipmentItemStatusAssigned,
  },
  ACTIVE: {
    slug: 'ACTIVE',
    color: 'warn',
    labelKey: 'equipmentItemStatus.active',
    label: Labels.EquipmentItemStatusActive,
  },
  RETURNED: {
    slug: 'RETURNED',
    color: 'default',
    labelKey: 'equipmentItemStatus.returned',
    label: Labels.Returned,
  },
};

const DEFAULT_RENTAL_STATUS: RentalStatusMeta = {
  slug: '',
  color: 'default',
  labelKey: '',
  label: '',
  badgeClasses: 'bg-gray-100 text-gray-600',
};
const DEFAULT_EQUIPMENT_ITEM_STATUS: EquipmentItemStatusMeta = {
  slug: '',
  color: 'default',
  labelKey: '',
  label: '',
};

export function mapRentalStatus(slug: string): RentalStatusMeta {
  return RentalStatus[slug] ?? DEFAULT_RENTAL_STATUS;
}

export function mapEquipmentItemStatus(slug: string): EquipmentItemStatusMeta {
  return EquipmentItemStatus[slug] ?? DEFAULT_EQUIPMENT_ITEM_STATUS;
}
