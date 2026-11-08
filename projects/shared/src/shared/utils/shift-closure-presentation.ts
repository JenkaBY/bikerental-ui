import { formatDate } from '@angular/common';
import { Observable } from 'rxjs';
import { makeMoney } from '../../core/mappers/money.mapper';
import type { Money, RunningShift, ShiftClosure } from '../../core/models';
import {
  type FinanceConfirmData,
  type FinanceConfirmRow,
} from '../components/finance-confirm-dialog/finance-confirm-dialog.component';
import { Labels } from '../constant/labels';
import { shiftShortageMessage, shiftSurplusMessage } from '../constant/point-money-messages';
import { formatFixedMoney } from '../pipes/fixed-money.pipe';
import { ShiftDifference, type ShiftDifferenceResult } from './shift-difference';

export interface ShiftClosureSummary {
  readonly shift: RunningShift;
  readonly counted: Money;
  readonly difference: ShiftDifferenceResult;
}

export function describeShiftDifference(
  difference: ShiftDifferenceResult,
  locale: string,
  symbol: string,
): string {
  const magnitude = formatFixedMoney(
    makeMoney(Math.abs(difference.amount.amount), difference.amount.currency),
    locale,
    symbol,
  );
  switch (difference.kind) {
    case 'SURPLUS':
      return shiftSurplusMessage(magnitude);
    case 'SHORTAGE':
      return shiftShortageMessage(magnitude);
    case 'MATCHES':
      return Labels.ShiftClosureMatches;
  }
}

export function buildShiftClosureRows(
  closure: ShiftClosure,
  locale: string,
  symbol: string,
): readonly FinanceConfirmRow[] {
  const difference = ShiftDifference.of(closure.countedAmount, closure.expectedCash);
  return [
    {
      label: Labels.PointShiftExpectedCash,
      value: formatFixedMoney(closure.expectedCash, locale, symbol),
    },
    {
      label: Labels.ShiftClosureCounted,
      value: formatFixedMoney(closure.countedAmount, locale, symbol),
    },
    {
      label: Labels.ShiftClosureDifference,
      value: describeShiftDifference(difference, locale, symbol),
    },
    { label: Labels.ShiftClosureClosedAt, value: formatDate(closure.closedAt, 'short', locale) },
  ];
}

export function buildShiftClosureConfirm<T>(
  summary: ShiftClosureSummary,
  locale: string,
  symbol: string,
  execute: () => Observable<T>,
): FinanceConfirmData<T> {
  return {
    title: Labels.ShiftClosureConfirmTitle,
    rows: [
      { label: Labels.ShiftClosureShiftRow, value: String(summary.shift.sequence) },
      {
        label: Labels.PointShiftExpectedCash,
        value: formatFixedMoney(summary.shift.expectedCash, locale, symbol),
      },
      {
        label: Labels.ShiftClosureCounted,
        value: formatFixedMoney(summary.counted, locale, symbol),
      },
      {
        label: Labels.ShiftClosureDifference,
        value: describeShiftDifference(summary.difference, locale, symbol),
      },
    ],
    note: Labels.ShiftClosureNote,
    backLabel: Labels.Back,
    confirmLabel: Labels.PointCloseShift,
    execute,
  };
}
