import { formatDate } from '@angular/common';
import type { PointPeriod } from '../../core/models/point-finance.model';

export class BusinessPeriod {
  static currentMonthToDate(now: Date): PointPeriod {
    return {
      from: new Date(now.getFullYear(), now.getMonth(), 1),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  }

  static sinceDayOf(start: Date, now: Date): PointPeriod {
    return {
      from: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
      to: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
    };
  }

  static monthName(date: Date, locale: string): string {
    return formatDate(date, 'LLLL', locale);
  }
}
