export const DURATION_SNAP_POINTS = [30, 60, 120, 180, 240, 300, 360, 480, 1440, 2880];

export function findNearestIndex(
  value: number,
  snaps: readonly number[] = DURATION_SNAP_POINTS,
): number {
  if (snaps.length === 0) return 0;
  return snaps.reduce(
    (bestIdx, curr, i) => (Math.abs(curr - value) < Math.abs(snaps[bestIdx] - value) ? i : bestIdx),
    0,
  );
}

export function snapToNearest(value: number): number {
  return DURATION_SNAP_POINTS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}
