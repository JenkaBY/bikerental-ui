import type {
  CustomerTransaction,
  LedgerType,
  TransactionDirection,
  TransactionKind,
} from '../core/models/transaction.model';
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

export interface TransactionFlow {
  from: string;
  to: string;
}

type FlowBucket = 'wallet' | 'hold' | 'external';

export function mapTransactionFlow(
  transaction: Pick<CustomerTransaction, 'kind' | 'deltas'>,
): TransactionFlow | null {
  const deltas = transaction.deltas;
  if (!deltas) return null;

  const externalLabel =
    transaction.kind === 'CAPTURE' ? Labels.FinanceShop : Labels.FinanceExternal;
  const bucketLabel = (bucket: FlowBucket): string =>
    bucket === 'wallet'
      ? Labels.Available
      : bucket === 'hold'
        ? Labels.CustomerBalanceReserved
        : externalLabel;

  let from: FlowBucket | null = null;
  let to: FlowBucket | null = null;

  if (deltas.external.amount > 0) from = 'external';
  else if (deltas.external.amount < 0) to = 'external';
  if (deltas.wallet.amount < 0) from = 'wallet';
  else if (deltas.wallet.amount > 0) to = 'wallet';
  if (deltas.hold.amount < 0) from = 'hold';
  else if (deltas.hold.amount > 0) to = 'hold';

  return from && to ? { from: bucketLabel(from), to: bucketLabel(to) } : null;
}

export interface LedgerTypeMeta {
  readonly type: LedgerType;
  readonly icon: string;
  readonly label: string;
}

const LEDGER_TYPE_META: Record<LedgerType, LedgerTypeMeta> = {
  CASH: { type: 'CASH', icon: 'payments', label: Labels.LedgerTypeCash },
  CARD_TERMINAL: {
    type: 'CARD_TERMINAL',
    icon: 'credit_card',
    label: Labels.LedgerTypeCardTerminal,
  },
  BANK_TRANSFER: {
    type: 'BANK_TRANSFER',
    icon: 'account_balance',
    label: Labels.LedgerTypeBankTransfer,
  },
  REVENUE: { type: 'REVENUE', icon: 'storefront', label: Labels.LedgerTypeRevenue },
  ADJUSTMENT: { type: 'ADJUSTMENT', icon: 'tune', label: Labels.LedgerTypeAdjustment },
  CUSTOMER_WALLET: {
    type: 'CUSTOMER_WALLET',
    icon: 'account_balance_wallet',
    label: Labels.LedgerTypeCustomerWallet,
  },
  CUSTOMER_HOLD: { type: 'CUSTOMER_HOLD', icon: 'lock', label: Labels.LedgerTypeCustomerHold },
};

export function mapLedgerType(type: string): LedgerTypeMeta {
  return (
    LEDGER_TYPE_META[type as LedgerType] ?? {
      type: type as LedgerType,
      icon: 'receipt_long',
      label: type,
    }
  );
}

export function mapTransactionDirectionLabel(direction: TransactionDirection): string {
  return direction === 'CREDIT'
    ? Labels.TransactionDirectionCredit
    : Labels.TransactionDirectionDebit;
}
