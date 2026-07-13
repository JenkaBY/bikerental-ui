import type { RentalStatusMeta, EquipmentItemStatusMeta } from '../core/models/rental.model';
import { Labels } from './constant/labels';

export const RentalStatus: Record<string, RentalStatusMeta> = {
  DRAFT: {
    slug: 'DRAFT',
    color: 'default',
    label: Labels.RentalStatusDraft,
    badgeClasses: 'bg-gray-100 text-gray-600',
  },
  AWAITING_SIGNATURE: {
    slug: 'AWAITING_SIGNATURE',
    color: 'accent',
    label: Labels.RentalStatusAwaitingSignature,
    badgeClasses: 'bg-purple-100 text-purple-700',
  },
  ACTIVE: {
    slug: 'ACTIVE',
    color: 'primary',
    label: Labels.RentalStatusActive,
    badgeClasses: 'bg-blue-100 text-blue-700',
  },
  COMPLETED: {
    slug: 'COMPLETED',
    color: 'default',
    label: Labels.RentalStatusCompleted,
    badgeClasses: 'bg-gray-100 text-gray-600',
  },
  CANCELLED: {
    slug: 'CANCELLED',
    color: 'warn',
    label: Labels.RentalStatusCancelled,
    badgeClasses: 'bg-red-100 text-red-700',
  },
  DEBT: {
    slug: 'DEBT',
    color: 'warn',
    label: Labels.RentalStatusDebt,
    badgeClasses: 'bg-amber-100 text-amber-700',
  },
};

export const EquipmentItemStatus: Record<string, EquipmentItemStatusMeta> = {
  ASSIGNED: {
    slug: 'ASSIGNED',
    color: 'primary',
    label: Labels.EquipmentItemStatusAssigned,
  },
  ACTIVE: {
    slug: 'ACTIVE',
    color: 'warn',
    label: Labels.EquipmentItemStatusActive,
  },
  RETURNED: {
    slug: 'RETURNED',
    color: 'default',
    label: Labels.Returned,
  },
};

const DEFAULT_RENTAL_STATUS: RentalStatusMeta = {
  slug: '',
  color: 'default',
  label: '',
  badgeClasses: 'bg-gray-100 text-gray-600',
};
const DEFAULT_EQUIPMENT_ITEM_STATUS: EquipmentItemStatusMeta = {
  slug: '',
  color: 'default',
  label: '',
};

export function mapRentalStatus(slug: string): RentalStatusMeta {
  return RentalStatus[slug] ?? DEFAULT_RENTAL_STATUS;
}

export function mapEquipmentItemStatus(slug: string): EquipmentItemStatusMeta {
  return EquipmentItemStatus[slug] ?? DEFAULT_EQUIPMENT_ITEM_STATUS;
}
