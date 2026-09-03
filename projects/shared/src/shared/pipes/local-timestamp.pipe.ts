import { formatDate } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

export const LOCAL_TIMESTAMP_FORMAT = 'dd.MM.yyyy HH:mm';
export const LOCAL_TIMESTAMP_EMPTY = '-';

@Pipe({ name: 'localTimestamp', standalone: true })
export class LocalTimestampPipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(value: Date | string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') return LOCAL_TIMESTAMP_EMPTY;
    try {
      return formatDate(value, LOCAL_TIMESTAMP_FORMAT, this.locale);
    } catch {
      return LOCAL_TIMESTAMP_EMPTY;
    }
  }
}
