import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'truncate', standalone: true })
export class TruncatePipe implements PipeTransform {
  /**
   * Truncate a string to `max` characters and append ellipsis when truncated.
   * If max <= 0, returns an empty string for nullish/empty values.
   */
  transform(value: string | null | undefined, max = 50): string {
    if (!value) return '';
    const m = Number(max) || 0;
    if (m <= 0) return '';
    if (value.length <= m) return value;
    if (m <= 3) return value.slice(0, m);
    // Reserve 3 chars for ellipsis
    return value.slice(0, m - 3) + '...';
  }
}
