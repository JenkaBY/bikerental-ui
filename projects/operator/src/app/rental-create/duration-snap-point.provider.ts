import { InjectionToken, Provider } from '@angular/core';

export const DURATION_SNAP_POINTS = [30, 60, 120, 240, 480, 1440, 2880] as const;

export const DURATION_SNAP_POINTS_TOKEN = new InjectionToken<readonly number[]>(
  'DURATION_SNAP_POINTS_TOKEN',
);

export const SNAP_TO_NEAREST_TOKEN = new InjectionToken<(value: number) => number>(
  'SNAP_TO_NEAREST_TOKEN',
);

export function snapToNearest(value: number): number {
  return DURATION_SNAP_POINTS.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev,
  );
}

export const durationSnapPointProviders: Provider[] = [
  { provide: DURATION_SNAP_POINTS_TOKEN, useValue: DURATION_SNAP_POINTS },
  { provide: SNAP_TO_NEAREST_TOKEN, useValue: snapToNearest },
];
