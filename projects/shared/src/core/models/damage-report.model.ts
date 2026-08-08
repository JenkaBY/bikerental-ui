import type { EquipmentCondition } from './equipment.model';
import type { Money } from './transaction.model';

export type PenaltyStatus = 'PENDING' | 'SETTLED';

export type DamageCondition = 'BROKEN' | 'NEEDS_MAINTENANCE';

export interface Penalty {
  readonly amount: Money;
  readonly status: PenaltyStatus;
  readonly transactionId?: string;
  readonly isSettled: boolean;
}

export interface DamageReportItem {
  readonly equipmentId: number;
  readonly equipmentUid: string;
  /** Resolved from the equipment catalogue — the report payload carries only ids and uids. */
  readonly equipmentModel?: string;
  readonly previousCondition?: EquipmentCondition;
  readonly condition?: EquipmentCondition;
}

export interface DamageReport {
  readonly id: number;
  readonly rentalId?: number;
  readonly customerId?: string;
  readonly items: readonly DamageReportItem[];
  readonly description: string;
  readonly reportedAt: Date;
  readonly operatorId: string;
  readonly penalty?: Penalty;
}

export interface DamageReportListItem {
  readonly id: number;
  readonly rentalId?: number;
  readonly customerId?: string;
  readonly description: string;
  readonly reportedAt: Date;
  readonly operatorId: string;
  readonly penalty?: Penalty;
}

export interface DamageReportWrite {
  readonly equipmentIds: number[];
  readonly rentalId?: number;
  readonly customerId?: string;
  readonly condition: DamageCondition;
  readonly description: string;
  readonly penaltyAmount?: number;
  readonly idempotencyKey: string;
}

export interface DamageReportFilter {
  readonly equipmentId?: number;
  readonly customerId?: string;
  readonly rentalId?: number;
  readonly penaltyStatus?: PenaltyStatus;
  readonly from?: Date;
  readonly to?: Date;
}
