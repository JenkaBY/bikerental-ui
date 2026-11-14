import type { GeoLocationWrite } from './geo.model';

export type PointStatus = 'INACTIVE' | 'ACTIVE' | 'PERMANENTLY_CLOSED';

export interface PointContacts {
  primaryPhone: string;
  additionalPhone?: string;
  email?: string;
}

export interface Point {
  slug: string;
  name: string;
  geoLocationId: number | null;
  timeZone: string | null;
  contacts: PointContacts;
  status: PointStatus;
}

export interface PointWrite {
  slug: string;
  name: string;
  geoLocationId: number;
  timeZone: string;
  contacts: PointContacts;
}

export interface PointDraft {
  slug: string;
  name: string;
  timeZone: string;
  contacts: PointContacts;
  location: GeoLocationWrite | number;
}
