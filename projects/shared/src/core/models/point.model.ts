export type PointStatus = 'INACTIVE' | 'ACTIVE' | 'PERMANENTLY_CLOSED';

export interface PointAddress {
  street: string;
  city: string;
  country: string;
}

export interface PointContacts {
  primaryPhone: string;
  additionalPhone?: string;
  email?: string;
}

export interface Point {
  id: string;
  slug: string;
  name: string;
  address: PointAddress;
  contacts: PointContacts;
  status: PointStatus;
}

export interface PointWrite {
  slug: string;
  name: string;
  address: PointAddress;
  contacts: PointContacts;
}

export interface PointOccupancy {
  kind: string;
  count?: number;
  determined: boolean;
}

export interface PointStatusChangeResult {
  point?: Point;
  closureSummary: PointOccupancy[];
}
