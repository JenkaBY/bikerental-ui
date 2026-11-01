import { makeMoney } from '../../core/mappers/money.mapper';
import type { ApiError } from '../../core/errors/api-error.model';
import { ErrorCode } from '../../core/errors/error-code';
import type { Money } from '../../core/models';

export type PointMoneyErrorOutcome =
  | {
      readonly kind: 'INSUFFICIENT_CASH' | 'INSUFFICIENT_TERMINAL';
      readonly currentPosition: Money | null;
    }
  | {
      readonly kind:
        | 'POINT_NOT_ACTIVE'
        | 'POINT_PERMANENTLY_CLOSED'
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
      case ErrorCode.SCOPE_NOT_ESTABLISHED:
        return { kind: 'SCOPE' };
      default:
        return { kind: error.kind === 'validation' ? 'VALIDATION' : 'OTHER' };
    }
  }

  private static positionOf(error: ApiError, param: string): Money | null {
    const value = error.params[param];
    return typeof value === 'number' ? makeMoney(value) : null;
  }
}
