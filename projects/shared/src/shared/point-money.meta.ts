import type {
  PointMovementKind,
  PointMovementPosition,
  PointPeriodViolation,
} from '../core/models/point-finance.model';
import { Labels } from './constant/labels';
import { FormErrorMessages } from './validators/form-error-messages';

export const POINT_MOVEMENT_KIND_LABELS: Record<PointMovementKind, string> = {
  DEPOSIT: Labels.TransactionKindDeposit,
  WITHDRAWAL: Labels.TransactionKindWithdrawal,
  HOLD: Labels.TransactionKindHold,
  CAPTURE: Labels.PointMovementKindRentalPayment,
  RELEASE: Labels.TransactionKindRelease,
  PENALTY: Labels.TransactionKindPenalty,
  ADJUSTMENT: Labels.TransactionKindAdjustment,
  COLLECTION: Labels.PointMovementKindCollection,
  TERMINAL_SETTLEMENT: Labels.PointMovementKindTerminalSettlement,
  SHIFT_DISCREPANCY: Labels.PointMovementKindShiftDiscrepancy,
  OTHER: Labels.TransactionKindOther,
};

export const POINT_MOVEMENT_POSITION_LABELS: Record<PointMovementPosition, string> = {
  CASH: Labels.PointPositionCash,
  CARD_TERMINAL: Labels.PointPositionTerminal,
  BANK: Labels.PointPositionBank,
};

export const POINT_PERIOD_VIOLATION_MESSAGES: Record<PointPeriodViolation, string> = {
  REQUIRED: FormErrorMessages.periodRequired,
  ORDER: FormErrorMessages.periodOrder,
  TOO_LONG: FormErrorMessages.periodTooLong,
};
