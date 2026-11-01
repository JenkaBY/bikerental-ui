import { Observable } from 'rxjs';
import { type FinanceConfirmData, formatFixedMoney, Labels, type Money } from '@bikerental/shared';

export interface OperatorCollectionSummary {
  readonly pointName: string;
  readonly amount: Money;
  readonly remaining: Money;
}

export function buildCollectionConfirm<T>(
  summary: OperatorCollectionSummary,
  locale: string,
  execute: () => Observable<T>,
): FinanceConfirmData<T> {
  return {
    title: Labels.OperatorHandInConfirmTitle,
    rows: [
      { label: Labels.PointMoveAmount, value: formatFixedMoney(summary.amount, locale) },
      {
        label: Labels.PointMoveSourceLabel,
        value: `${summary.pointName} · ${Labels.PointCashCardTitle}`,
      },
      { label: Labels.PointMoveDestinationLabel, value: Labels.PointMoveBankAccount },
      { label: Labels.PointMoveRemainingRow, value: formatFixedMoney(summary.remaining, locale) },
    ],
    note: Labels.OperatorHandInNote,
    backLabel: Labels.Back,
    confirmLabel: Labels.OperatorHandInConfirm,
    execute,
  };
}
