import type { Money } from './transaction.model';

export interface CustomerRentalEquipment {
  readonly id: number;
  readonly uid?: string;
  readonly name: string;
}

export interface CustomerRentalSummary {
  readonly id: number;
  readonly status: string;
  readonly createdAt: Date;
  readonly startedAt: Date;
  readonly expectedReturnAt?: Date;
  readonly estimatedCost?: Money;
  readonly finalCost?: Money;
  readonly equipment: CustomerRentalEquipment[];
}

export interface RentalStatusMeta {
  readonly slug: string;
  readonly color: 'primary' | 'accent' | 'warn' | 'default';
  readonly label: string;
  readonly badgeClasses: string;
}

export interface EquipmentItemStatusMeta {
  readonly slug: string;
  readonly color: 'primary' | 'accent' | 'warn' | 'default';
  readonly label: string;
}
