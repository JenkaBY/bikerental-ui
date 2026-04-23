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
