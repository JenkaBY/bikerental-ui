export function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // Accept ISO-like date (YYYY-MM-DD) and produce a local Date at midnight
  try {
    return new Date(dateStr + 'T00:00:00');
  } catch {
    return null;
  }
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function toDateTimeLocalString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function minutesBetween(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
}

export function parseDateTimeLocal(value: string): Date {
  const [datePart = '', timePart = ''] = value.split('T');
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const [hourStr = '0', minuteStr = '0', secondStr = '0'] = timePart.split(':');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const day = parseInt(dayStr, 10);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  const second = parseInt(secondStr, 10);
  return new Date(
    year,
    (isNaN(month) ? 1 : month) - 1,
    isNaN(day) ? 1 : day,
    isNaN(hour) ? 0 : hour,
    isNaN(minute) ? 0 : minute,
    isNaN(second) ? 0 : second,
  );
}
