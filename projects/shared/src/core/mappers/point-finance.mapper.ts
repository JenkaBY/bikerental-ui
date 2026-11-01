import { POINT_POSITION_KINDS } from '../models';
import type { Money, PointPositionAmounts, PointPositionKind } from '../models';
import { makeMoney } from './money.mapper';

export interface PointPositionEntry {
  readonly kind: string;
  readonly amount: number;
}

export class PointFinanceMapper {
  static toPositionKind(raw: string | null | undefined): PointPositionKind | null {
    return POINT_POSITION_KINDS.find((kind) => kind === raw) ?? null;
  }

  static toAmounts(entries: readonly PointPositionEntry[]): PointPositionAmounts {
    const totals = new Map<PointPositionKind, number>();
    for (const entry of entries) {
      const kind = PointFinanceMapper.toPositionKind(entry.kind);
      if (kind) totals.set(kind, (totals.get(kind) ?? 0) + entry.amount);
    }
    return {
      CASH: PointFinanceMapper.money(totals.get('CASH')),
      CARD_TERMINAL: PointFinanceMapper.money(totals.get('CARD_TERMINAL')),
      BANK: PointFinanceMapper.money(totals.get('BANK')),
      REVENUE: PointFinanceMapper.money(totals.get('REVENUE')),
      CORRECTIONS: PointFinanceMapper.money(totals.get('CORRECTIONS')),
    };
  }

  static money(amount: number | null | undefined): Money {
    return makeMoney(PointFinanceMapper.round(amount ?? 0));
  }

  static sum(a: Money, b: Money): Money {
    return makeMoney(PointFinanceMapper.round(a.amount + b.amount), a.currency);
  }

  private static round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
