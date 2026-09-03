import { Pipe, PipeTransform } from '@angular/core';

export const SHORT_ID_VISIBLE_CHARS = 3;

export function shortenId(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '';
  const text = String(value);
  if (text.length <= SHORT_ID_VISIBLE_CHARS) return `#${text}`;
  return `#...${text.slice(-SHORT_ID_VISIBLE_CHARS)}`;
}

@Pipe({ name: 'shortId', standalone: true })
export class ShortIdPipe implements PipeTransform {
  transform(value: string | number | null | undefined): string {
    return shortenId(value);
  }
}
