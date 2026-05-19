import { Labels } from '../constant/labels';

export function normalizeToHuman(unroundedMinutes: number | undefined): string {
  const minLabel = Labels.MinuteShort;
  if (!unroundedMinutes) {
    return `-- ${minLabel}`;
  }
  const minutes = Math.ceil(unroundedMinutes);
  const hourLabel = Labels.HourShort;
  if (minutes < 60) return `${minutes} ${minLabel}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ${hourLabel} ${m} ${minLabel}` : `${h} ${hourLabel}`;
}
