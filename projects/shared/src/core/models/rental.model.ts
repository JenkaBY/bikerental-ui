import type { Money } from './transaction.model';

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
  readonly colour: 'primary' | 'accent' | 'warn' | 'default';
  readonly labelKey: string;
}

export interface EquipmentItemStatusMeta {
  readonly slug: string;
  readonly colour: 'primary' | 'accent' | 'warn' | 'default';
  readonly labelKey: string;
}

export const RentalStatus: Record<string, RentalStatusMeta> = {
  DRAFT: { slug: 'DRAFT', colour: 'default', labelKey: 'rentalStatus.draft' },
  ACTIVE: { slug: 'ACTIVE', colour: 'primary', labelKey: 'rentalStatus.active' },
  COMPLETED: { slug: 'COMPLETED', colour: 'default', labelKey: 'rentalStatus.completed' },
  CANCELLED: { slug: 'CANCELLED', colour: 'default', labelKey: 'rentalStatus.cancelled' },
  DEBT: { slug: 'DEBT', colour: 'warn', labelKey: 'rentalStatus.debt' },
};

export const EquipmentItemStatus: Record<string, EquipmentItemStatusMeta> = {
  ASSIGNED: { slug: 'ASSIGNED', colour: 'primary', labelKey: 'equipmentItemStatus.assigned' },
  ACTIVE: { slug: 'ACTIVE', colour: 'warn', labelKey: 'equipmentItemStatus.active' },
  RETURNED: { slug: 'RETURNED', colour: 'default', labelKey: 'equipmentItemStatus.returned' },
};

const DEFAULT_RENTAL_STATUS: RentalStatusMeta = { slug: '', colour: 'default', labelKey: '' };
const DEFAULT_EQUIPMENT_ITEM_STATUS: EquipmentItemStatusMeta = {
  slug: '',
  colour: 'default',
  labelKey: '',
};

export function mapRentalStatus(slug: string): RentalStatusMeta {
  return RentalStatus[slug] ?? DEFAULT_RENTAL_STATUS;
}

export function mapEquipmentItemStatus(slug: string): EquipmentItemStatusMeta {
  return EquipmentItemStatus[slug] ?? DEFAULT_EQUIPMENT_ITEM_STATUS;
}
