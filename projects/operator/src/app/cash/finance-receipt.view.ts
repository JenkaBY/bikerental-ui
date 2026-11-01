import { formatDate } from '@angular/common';
import { type FinanceReceipt, formatFixedMoney, Labels, type Money } from '@bikerental/shared';

export interface FinanceReceiptRow {
  readonly label: string;
  readonly value: string;
}

export interface FinanceReceiptView {
  readonly title: string;
  readonly amount: Money;
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
  }
}
