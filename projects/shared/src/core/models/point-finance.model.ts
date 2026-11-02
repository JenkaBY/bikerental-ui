import type { PointStatus } from './point.model';
import type { Money } from './transaction.model';

export const POINT_POSITION_KINDS = [
  'CASH',
  'CARD_TERMINAL',
  'BANK',
  'REVENUE',
  'CORRECTIONS',
] as const;

export type PointPositionKind = (typeof POINT_POSITION_KINDS)[number];

export type PointPositionAmounts = Readonly<Record<PointPositionKind, Money>>;

export interface PointPositions {
  readonly pointSlug: string;
  readonly amounts: PointPositionAmounts;
  readonly pointStatus: PointStatus | null;
}

export interface PointPositionsOverview {
  readonly points: readonly PointPositions[];
  readonly totals: PointPositionAmounts;
}

export interface PointPeriod {
  readonly from: Date;
  readonly to: Date;
}

export interface PointPeriodResults {
  readonly from: Date;
  readonly to: Date;
  readonly pointSlug: string | null;
  readonly revenue: Money;
  readonly corrections: Money;
  readonly result: Money;
  readonly collected: Money;
  readonly collectedCount: number | null;
  readonly terminalSettled: Money;
  readonly terminalSettledCount: number | null;
  readonly total: Money;
}

export interface PointMoneyRow {
  readonly slug: string;
  readonly name: string;
  readonly status: PointStatus;
  readonly cash: Money | null;
  readonly terminal: Money | null;
  readonly bank: Money | null;
}

export interface PointMoneySummary {
  readonly cash: Money | null;
  readonly terminal: Money | null;
  readonly deposited: Money | null;
  readonly collected: Money | null;
  readonly terminalSettled: Money | null;
  readonly monthName: string;
}

export const POINT_MOVEMENT_FILTER_KINDS = [
  'DEPOSIT',
  'WITHDRAWAL',
  'HOLD',
  'CAPTURE',
  'RELEASE',
  'PENALTY',
  'ADJUSTMENT',
  'COLLECTION',
  'TERMINAL_SETTLEMENT',
  'SHIFT_DISCREPANCY',
] as const;

export type PointMovementFilterKind = (typeof POINT_MOVEMENT_FILTER_KINDS)[number];

export const POINT_MOVEMENT_KINDS = [...POINT_MOVEMENT_FILTER_KINDS, 'OTHER'] as const;

export type PointMovementKind = (typeof POINT_MOVEMENT_KINDS)[number];

export type PointMovementPosition = Extract<PointPositionKind, 'CASH' | 'CARD_TERMINAL' | 'BANK'>;

export const POINT_MOVEMENT_POSITIONS: readonly PointMovementPosition[] = [
  'CASH',
  'CARD_TERMINAL',
  'BANK',
];

export type PointMovementOrder = 'newest' | 'oldest';

export const POINT_MOVEMENTS_MAX_PAGE_SIZE = 100;

export const POINT_PERIOD_MAX_DAYS = 366;

export type PointPeriodViolation = 'REQUIRED' | 'ORDER' | 'TOO_LONG';

export interface PointMovement {
  readonly transactionId: string;
  readonly recordedAt: Date;
  readonly kind: PointMovementKind;
  readonly signedAmount: Money;
  readonly runningBalance: Money | null;
  readonly recordedById: string;
  readonly customerId: string | null;
  readonly rentalId: number | null;
  readonly shiftId: string | null;
}

export interface PointMovementPage {
  readonly items: readonly PointMovement[];
  readonly totalItems: number;
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface PointMovementQuery {
  readonly pointSlug: string;
  readonly position: PointMovementPosition;
  readonly period: PointPeriod;
  readonly order: PointMovementOrder;
  readonly kinds: readonly PointMovementFilterKind[];
  readonly page: number;
  readonly size: number;
}

export interface PointMovementRow extends PointMovement {
  readonly recordedByName: string;
  readonly customerName?: string;
}
