import { Pipe, PipeTransform } from '@angular/core';
import { normalizeToHuman } from './duration-formatter';

@Pipe({ name: 'duration', standalone: true })
export class DurationPipe implements PipeTransform {
  transform(minutes: number | undefined): string {
    return normalizeToHuman(minutes);
  }
}
