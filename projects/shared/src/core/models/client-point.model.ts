import type { PointStatus } from './point.model';

export interface ClientPoint {
  readonly slug: string;
  readonly name: string;
  readonly geoLocationId: number | null;
  readonly timeZone: string | null;
  readonly status: PointStatus;
}
