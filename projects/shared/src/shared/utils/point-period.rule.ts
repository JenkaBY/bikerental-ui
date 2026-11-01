import {
  POINT_PERIOD_MAX_DAYS,
  type PointPeriodViolation,
} from '../../core/models/point-finance.model';
import { daysInclusive } from './date.util';

export class PointPeriodRule {
  static validate(from: Date | null, to: Date | null): PointPeriodViolation | null {
    if (!from || !to) return 'REQUIRED';
    const days = daysInclusive(from, to);
    if (days < 1) return 'ORDER';
    if (days > POINT_PERIOD_MAX_DAYS) return 'TOO_LONG';
    return null;
  }
}
