import { makeMoney } from '../../core/mappers/money.mapper';
import type { ApiError } from '../../core/errors/api-error.model';
import { ErrorCode } from '../../core/errors/error-code';
import type { Money } from '../../core/models';

const CONFLICT_STATUS = 409;
const UNPROCESSABLE_STATUS = 422;

export type PointMoneyErrorOutcome =
  | {
      readonly kind: 'INSUFFICIENT_CASH' | 'INSUFFICIENT_TERMINAL';
      readonly currentPosition: Money | null;
    }
  | {
      readonly kind:
        | 'POINT_NOT_ACTIVE'
        | 'POINT_PERMANENTLY_CLOSED'
        | 'SHIFT_NOT_RUNNING'
        | 'SCOPE'
        | 'VALIDATION'
        | 'OTHER';
    };

export class PointMoneyErrorClassifier {
  static classify(error: ApiError): PointMoneyErrorOutcome {
    switch (error.code) {
      case ErrorCode.FINANCE_POINT_INSUFFICIENT_CASH:
        return {
          kind: 'INSUFFICIENT_CASH',
          currentPosition: PointMoneyErrorClassifier.positionOf(error, 'cashPosition'),
        };
      case ErrorCode.FINANCE_POINT_INSUFFICIENT_TERMINAL:
        return {
          kind: 'INSUFFICIENT_TERMINAL',
          currentPosition: PointMoneyErrorClassifier.positionOf(error, 'cardTerminalPosition'),
        };
      case ErrorCode.FINANCE_POINT_INACTIVE:
        return { kind: 'POINT_NOT_ACTIVE' };
      case ErrorCode.FINANCE_POINT_PERMANENTLY_CLOSED:
        return { kind: 'POINT_PERMANENTLY_CLOSED' };
      case ErrorCode.FINANCE_SHIFT_NOT_RUNNING:
        return { kind: 'SHIFT_NOT_RUNNING' };
      case ErrorCode.SCOPE_NOT_ESTABLISHED:
        return { kind: 'SCOPE' };
      default:
        return { kind: error.kind === 'validation' ? 'VALIDATION' : 'OTHER' };
    }
  }

  static classifyClosure(error: ApiError): PointMoneyErrorOutcome {
    const outcome = PointMoneyErrorClassifier.classify(error);
    const conflict = error.status === CONFLICT_STATUS || error.status === UNPROCESSABLE_STATUS;
    return outcome.kind === 'OTHER' && conflict ? { kind: 'SHIFT_NOT_RUNNING' } : outcome;
  }

  private static positionOf(error: ApiError, param: string): Money | null {
    const value = error.params[param];
    return typeof value === 'number' ? makeMoney(value) : null;
  }
}
