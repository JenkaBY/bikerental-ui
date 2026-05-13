export function truncateDecimalPlaces(value: string, decimals: number): string | null {
  const dotIndex = value.indexOf('.');
  if (dotIndex === -1 || value.length - dotIndex <= decimals + 1) return null;
  return value.slice(0, dotIndex + decimals + 1);
}
