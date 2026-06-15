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
