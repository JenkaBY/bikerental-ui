import { formatDate } from '@angular/common';
import {
  buildShiftClosureRows,
  type FinanceReceipt,
  formatFixedMoney,
  Labels,
  type Money,
  shiftClosedTitle,
} from '@bikerental/shared';

export interface FinanceReceiptRow {
  readonly label: string;
  readonly value: string;
}

export interface FinanceReceiptView {
  readonly title: string;
  readonly amount: Money | null;
  readonly rows: readonly FinanceReceiptRow[];
}

export function buildReceiptView(receipt: FinanceReceipt, locale: string): FinanceReceiptView {
  switch (receipt.kind) {
    case 'COLLECTION': {
      const { collection } = receipt;
      return {
        title: Labels.OperatorCashHandedIn,
        amount: collection.amount,
        rows: [
          { label: Labels.PointMoveSourceLabel, value: Labels.PointCashCardTitle },
          { label: Labels.PointMoveDestinationLabel, value: Labels.PointMoveBankAccount },
          {
            label: Labels.OperatorReceiptTime,
            value: formatDate(collection.recordedAt, 'short', locale),
          },
          {
            label: Labels.OperatorReceiptRemaining,
            value: formatFixedMoney(collection.cashPosition, locale),
          },
        ],
      };
    }
    case 'SHIFT_CLOSURE': {
      const { closure, pointName } = receipt;
      const pointRows = pointName ? [{ label: Labels.MoneyPointLabel, value: pointName }] : [];
      return {
        title: shiftClosedTitle(closure.sequence),
        amount: null,
        rows: [...pointRows, ...buildShiftClosureRows(closure, locale)],
      };
    }
  }
}
