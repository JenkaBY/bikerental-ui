import type { TransactionKind } from '../core/models/transaction.model';
import { Labels } from './constant/labels';

export interface TransactionKindMeta {
  kind: TransactionKind;
  icon: string;
  label: string;
}

export const TransactionKindMetaMap: Record<TransactionKind, TransactionKindMeta> = {
  DEPOSIT: { kind: 'DEPOSIT', icon: 'add_card', label: Labels.TransactionKindDeposit },
  WITHDRAWAL: { kind: 'WITHDRAWAL', icon: 'payments', label: Labels.TransactionKindWithdrawal },
  HOLD: { kind: 'HOLD', icon: 'lock', label: Labels.TransactionKindHold },
  RELEASE: { kind: 'RELEASE', icon: 'lock_open', label: Labels.TransactionKindRelease },
  CAPTURE: {
    kind: 'CAPTURE',
    icon: 'shopping_cart_checkout',
    label: Labels.TransactionKindCapture,
  },
  REFUND: { kind: 'REFUND', icon: 'undo', label: Labels.TransactionKindRefund },
  ADJUSTMENT: { kind: 'ADJUSTMENT', icon: 'tune', label: Labels.TransactionKindAdjustment },
  OTHER: { kind: 'OTHER', icon: 'receipt_long', label: Labels.TransactionKindOther },
};

export function mapTransactionKind(kind: TransactionKind): TransactionKindMeta {
  return TransactionKindMetaMap[kind] ?? TransactionKindMetaMap.OTHER;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  CASH: Labels.PaymentMethodCash,
  BANK_TRANSFER: Labels.PaymentMethodBankTransfer,
  CARD_TERMINAL: Labels.PaymentMethodCardTerminal,
  INTERNAL_TRANSFER: Labels.PaymentMethodInternalTransfer,
};

export function mapPaymentMethodLabel(paymentMethod: string): string {
  return PAYMENT_METHOD_LABELS[paymentMethod] ?? paymentMethod;
}
