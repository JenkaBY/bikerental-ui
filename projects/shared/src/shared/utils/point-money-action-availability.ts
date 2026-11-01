import type {
  ActionAvailability,
  ActionUnavailableReason,
  Money,
  PointStatus,
  RunningShiftState,
} from '../../core/models';

const ENABLED: ActionAvailability = { enabled: true, reason: null };

function blocked(reason: ActionUnavailableReason): ActionAvailability {
  return { enabled: false, reason };
}

function amountRule(amount: Money | null): ActionAvailability {
  if (amount === null) return blocked('UNKNOWN');
  return amount.amount > 0 ? ENABLED : blocked('NOTHING_TO_MOVE');
}

export class PointMoneyActionAvailability {
  static collection(
    pointStatus: PointStatus | null,
    cashAmount: Money | null,
    shiftState: RunningShiftState,
  ): ActionAvailability {
    if (shiftState !== 'running') return blocked('HIDDEN');
    if (pointStatus === null) return blocked('UNKNOWN');
    if (pointStatus !== 'ACTIVE') return blocked('POINT_NOT_ACTIVE');
    return amountRule(cashAmount);
  }

  static settlement(
    pointStatus: PointStatus | null,
    terminalAmount: Money | null,
  ): ActionAvailability {
    if (pointStatus === null) return blocked('UNKNOWN');
    if (pointStatus === 'PERMANENTLY_CLOSED') return blocked('POINT_PERMANENTLY_CLOSED');
    return amountRule(terminalAmount);
  }

  static closeShift(shiftState: RunningShiftState): ActionAvailability {
    return shiftState === 'running' ? ENABLED : blocked('HIDDEN');
  }
}
