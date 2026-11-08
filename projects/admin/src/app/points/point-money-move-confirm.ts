import { Observable } from 'rxjs';
import {
  type FinanceConfirmData,
  formatFixedMoney,
  Labels,
  type Money,
  type PointMoneyOperation,
} from '@bikerental/shared';
import { POINT_MOVE_CONFIRM_TITLES, POINT_MOVE_SOURCE_LABELS } from './point-money-move.meta';

export interface PointMoneyMoveSummary {
  readonly operation: PointMoneyOperation;
  readonly pointName: string;
  readonly amount: Money;
  readonly remaining: Money;
  readonly settlementDate: string | null;
}

export function buildMoveConfirmData<T>(
  summary: PointMoneyMoveSummary,
  locale: string,
  symbol: string,
  execute: () => Observable<T>,
): FinanceConfirmData<T> {
  const source = POINT_MOVE_SOURCE_LABELS[summary.operation];
  const dateRows = summary.settlementDate
    ? [{ label: Labels.PointMoveSettlementDate, value: summary.settlementDate }]
    : [];
  return {
    title: POINT_MOVE_CONFIRM_TITLES[summary.operation],
    rows: [
      { label: Labels.PointMoveAmount, value: formatFixedMoney(summary.amount, locale, symbol) },
      { label: Labels.PointMoveSourceLabel, value: `${summary.pointName} · ${source}` },
      { label: Labels.PointMoveDestinationLabel, value: Labels.PointMoveBankAccount },
      ...dateRows,
      {
        label: Labels.PointMoveRemainingRow,
        value: formatFixedMoney(summary.remaining, locale, symbol),
      },
    ],
    note: Labels.PointMoveNote,
    backLabel: Labels.Back,
    confirmLabel: Labels.PointMoveConfirm,
    execute,
  };
}
