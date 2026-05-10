import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | null | undefined): string {
    if (minutes == null || minutes < 0) return '';

    const days = Math.floor(minutes / 1440);
    const hours = Math.floor((minutes % 1440) / 60);
    const mins = minutes % 60;
    const parts: string[] = [];

    if (days > 0) {
      parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
    }

    if (hours > 0) {
      parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
    }

    if (mins > 0) {
      parts.push(`${mins} min`);
    }

    return parts.join(' ') || '0 min';
  }
}
