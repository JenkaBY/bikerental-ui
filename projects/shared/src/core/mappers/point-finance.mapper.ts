import type {
  PointFigureResponse,
  PointLedgerResponse,
  PointPositionsResponse,
  PositionTotal,
} from '@api-models';
import { POINT_POSITION_KINDS } from '../models';
import type {
  Money,
  PointPeriod,
  PointPeriodResults,
  PointPositionAmounts,
  PointPositionKind,
  PointPositions,
  PointPositionsOverview,
} from '../models';
import { makeMoney } from './money.mapper';

export interface PointPositionEntry {
  readonly kind: string;
  readonly amount: number;
}

type PointFigureType = PointFigureResponse['type'];

export class PointFinanceMapper {
  static positionsOverviewFromResponse(r: PointPositionsResponse): PointPositionsOverview {
    return {
      points: (r.points ?? []).map((p) => PointFinanceMapper.pointPositionsFromResponse(p)),
      totals: PointFinanceMapper.toAmounts(PointFinanceMapper.entriesOf(r.totals ?? [])),
    };
  }

  static pointPositionsFromResponse(r: PointLedgerResponse): PointPositions {
    return {
      pointSlug: r.pointSlug,
      amounts: PointFinanceMapper.toAmounts(PointFinanceMapper.entriesOf(r.positions ?? [])),
      pointStatus: null,
    };
  }

  static periodResultsFromFigures(
    figures: readonly PointFigureResponse[],
    period: PointPeriod,
    pointSlug: string | null,
  ): PointPeriodResults {
    const figureOf = (type: PointFigureType) => figures.find((f) => f.type === type);
    const amountOf = (type: PointFigureType) => PointFinanceMapper.money(figureOf(type)?.amount);
    const collected = amountOf('COLLECTIONS');
    const terminalSettled = amountOf('TERMINAL_SETTLEMENTS');
    return {
      from: period.from,
      to: period.to,
      pointSlug,
      revenue: amountOf('REVENUE'),
      corrections: amountOf('CORRECTIONS'),
      result: amountOf('RESULT'),
      collected,
      collectedCount: figureOf('COLLECTIONS')?.count ?? null,
      terminalSettled,
      terminalSettledCount: figureOf('TERMINAL_SETTLEMENTS')?.count ?? null,
      total: PointFinanceMapper.sum(collected, terminalSettled),
    };
  }

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

  private static entriesOf(positions: readonly PositionTotal[]): PointPositionEntry[] {
    return positions.map((p) => ({ kind: p.position, amount: p.balance }));
  }

  private static round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
