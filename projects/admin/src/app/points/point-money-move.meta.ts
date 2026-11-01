import { Labels, type PointMoneyOperation, type PointPositionKind } from '@bikerental/shared';

export const POINT_MOVE_TITLES: Record<PointMoneyOperation, string> = {
  COLLECTION: Labels.PointCollectCash,
  SETTLEMENT: Labels.PointRecordSettlement,
};

export const POINT_MOVE_CONFIRM_TITLES: Record<PointMoneyOperation, string> = {
  COLLECTION: Labels.PointMoveConfirmCollectionTitle,
  SETTLEMENT: Labels.PointMoveConfirmSettlementTitle,
};

export const POINT_MOVE_SOURCE_LABELS: Record<PointMoneyOperation, string> = {
  COLLECTION: Labels.PointCashCardTitle,
  SETTLEMENT: Labels.PointTerminalCardTitle,
};

export const POINT_MOVE_POSITIONS: Record<PointMoneyOperation, PointPositionKind> = {
  COLLECTION: 'CASH',
  SETTLEMENT: 'CARD_TERMINAL',
};
