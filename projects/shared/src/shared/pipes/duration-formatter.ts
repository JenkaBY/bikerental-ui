import { Labels } from '../constant/labels';

export function normalizeToHuman(unroundedMinutes: number | undefined, signed = false): string {
  const minLabel = Labels.MinuteShort;
  if (!unroundedMinutes) {
    return `-- ${minLabel}`;
  }
  const prefix = unroundedMinutes < 0 ? '− ' : signed ? '+ ' : '';
  const minutes = Math.ceil(Math.abs(unroundedMinutes));
  const hourLabel = Labels.HourShort;
  if (minutes < 60) return `${prefix}${minutes} ${minLabel}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${prefix}${h} ${hourLabel} ${m} ${minLabel}` : `${prefix}${h} ${hourLabel}`;
}
