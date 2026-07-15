function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatSmartTimestamp(date: Date, now: Date = new Date()): string {
  const time = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  if (isSameDay(date, now)) return time;
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)} ${time}`;
}
