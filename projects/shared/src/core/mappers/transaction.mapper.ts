import {
  type CustomerTransaction,
  type LedgerType,
  type TransactionBalances,
  type TransactionDeltas,
  type TransactionDetails,
  type TransactionDirection,
  type TransactionKind,
  type TransactionLedgerEntry,
  type TransactionListItem,
  type TransactionSummary,
} from '@ui-models';
import type {
  CustomerTransactionResponse,
  TransactionDetailEntryResponse,
  TransactionDetailsResponse,
  TransactionEntryResponse,
  TransactionResponse,
  TransactionSummaryResponse,
} from '@api-models';
import { makeMoney } from './money.mapper';

const KNOWN_KINDS: ReadonlySet<TransactionKind> = new Set<TransactionKind>([
  'DEPOSIT',
  'WITHDRAWAL',
  'HOLD',
  'RELEASE',
  'CAPTURE',
  'REFUND',
  'ADJUSTMENT',
  'PENALTY',
]);

const CREDIT_KINDS: ReadonlySet<TransactionKind> = new Set<TransactionKind>([
  'DEPOSIT',
  'RELEASE',
  'REFUND',
]);

const CUSTOMER_LEDGERS: ReadonlySet<LedgerType> = new Set<LedgerType>([
  'CUSTOMER_WALLET',
  'CUSTOMER_HOLD',
]);

interface TransactionCore {
  customerId: string;
  amount: number;
  type: string;
  recordedAt: string;
  paymentMethod: string;
  reason?: string;
  sourceType?: string;
  sourceId?: string;
  direction?: TransactionDirection;
  deltas?: TransactionDeltas;
  balances?: TransactionBalances;
}

export class TransactionMapper {
  static fromTransactionItem(item: CustomerTransactionResponse): CustomerTransaction {
    return TransactionMapper.fromCore({
      ...item,
      deltas: item.deltas ? TransactionMapper.toDeltas(item.deltas) : undefined,
      balances: item.balances ? TransactionMapper.toBalances(item.balances) : undefined,
    });
  }

  static fromTransactionSummary(item: TransactionSummaryResponse): TransactionListItem {
    const deltas = TransactionMapper.deriveDeltas(item.entries ?? []);
    return {
      ...TransactionMapper.fromCore({
        ...item,
        direction: TransactionMapper.directionFromDeltas(deltas),
        deltas,
      }),
      id: item.id,
    };
  }

  static fromTransactionDetails(r: TransactionDetailsResponse): TransactionDetails {
    const deltas = TransactionMapper.toDeltas(r.deltas);
    const balances = TransactionMapper.toBalances(r.balances);
    return {
      ...TransactionMapper.fromCore({
        ...r,
        direction: TransactionMapper.directionFromDeltas(deltas),
        deltas,
        balances,
      }),
      id: r.id,
      operatorId: r.operatorId,
      deltas,
      balances,
      entries: (r.entries ?? []).map(TransactionMapper.toLedgerEntry),
    };
  }

  static fromResponse(r: TransactionResponse): TransactionSummary {
    return {
      transactionId: r.transactionId,
      recordedAt: r.recordedAt ? new Date(r.recordedAt) : new Date(0),
    };
  }

  static latestHoldAmount(items: CustomerTransactionResponse[]): number {
    let latest: CustomerTransactionResponse | null = null;
    for (const item of items) {
      if (item.type !== 'HOLD') continue;
      if (!latest || new Date(item.recordedAt).getTime() > new Date(latest.recordedAt).getTime()) {
        latest = item;
      }
    }
    return latest?.amount ?? 0;
  }

  private static fromCore(core: TransactionCore): CustomerTransaction {
    const raw = core.amount;
    const recordedAt = core.recordedAt ? new Date(core.recordedAt) : new Date(0);
    const kind = TransactionMapper.normalizeKind(core.type);

    const isCredit = core.direction ? core.direction === 'CREDIT' : CREDIT_KINDS.has(kind);
    const signedAmount = raw === 0 ? 0 : isCredit ? raw : -raw;
    const amountColor = signedAmount > 0 ? 'positive' : signedAmount < 0 ? 'negative' : 'neutral';
    const description = core.reason ? core.reason : core.sourceType ? core.sourceType : core.type;

    return {
      customerId: core.customerId,
      amount: makeMoney(signedAmount),
      recordedAt,
      paymentMethod: core.paymentMethod,
      reason: core.reason,
      sourceType: core.sourceType,
      sourceId: core.sourceId,

      direction: core.direction,
      deltas: core.deltas,
      balances: core.balances,

      description: description,

      // UI aliases
      kind,
      amountColor,
    };
  }

  private static normalizeKind(type: string | undefined): TransactionKind {
    const normalized = (type ?? '').toUpperCase() as TransactionKind;
    return KNOWN_KINDS.has(normalized) ? normalized : 'OTHER';
  }

  private static toDeltas(d: {
    wallet: number;
    hold: number;
    external: number;
  }): TransactionDeltas {
    return {
      wallet: makeMoney(d.wallet),
      hold: makeMoney(d.hold),
      external: makeMoney(d.external),
    };
  }

  private static toBalances(b: { wallet: number; hold: number }): TransactionBalances {
    return { wallet: makeMoney(b.wallet), hold: makeMoney(b.hold) };
  }

  private static deriveDeltas(entries: readonly TransactionEntryResponse[]): TransactionDeltas {
    let wallet = 0;
    let hold = 0;
    for (const entry of entries) {
      const signed = entry.direction === 'CREDIT' ? entry.amount : -entry.amount;
      if (entry.ledgerType === 'CUSTOMER_WALLET') wallet += signed;
      else if (entry.ledgerType === 'CUSTOMER_HOLD') hold += signed;
    }
    return TransactionMapper.toDeltas({ wallet, hold, external: wallet + hold });
  }

  private static directionFromDeltas(deltas: TransactionDeltas): TransactionDirection | undefined {
    const effective = deltas.wallet.amount !== 0 ? deltas.wallet.amount : deltas.hold.amount;
    return effective > 0 ? 'CREDIT' : effective < 0 ? 'DEBIT' : undefined;
  }

  private static toLedgerEntry(e: TransactionDetailEntryResponse): TransactionLedgerEntry {
    return {
      ledgerType: e.ledgerType,
      direction: e.direction,
      amount: makeMoney(e.amount),
      signedDelta: makeMoney(e.signedDelta),
      balanceAfter: e.balanceAfter == null ? undefined : makeMoney(e.balanceAfter),
      systemLedger: e.systemLedger ?? !CUSTOMER_LEDGERS.has(e.ledgerType),
    };
  }
}
