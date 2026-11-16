export type ClientStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export const CLIENT_STATUSES: readonly ClientStatus[] = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'CLOSED'];

export interface ClientSummary {
  readonly slug: string;
  readonly displayName: string;
  readonly legalName: string;
  readonly currency: string;
  readonly status: ClientStatus;
  readonly createdAt?: Date;
}

export interface Client extends ClientSummary {
  readonly registrationNumber?: string;
  readonly contactEmail?: string;
  readonly contactPhone?: string;
  readonly businessGeoLocationId: number;
  readonly timeZone: string;
  readonly version: number;
  readonly createdBy?: string;
  readonly updatedAt?: Date;
}

export interface ClientDetailsWrite {
  displayName: string;
  legalName: string;
  registrationNumber: string;
  contactEmail: string;
  contactPhone: string;
  businessGeoLocationId: number;
}

export interface ClientRegistrationWrite extends ClientDetailsWrite {
  currency: string;
  timeZone: string;
}

export interface ClientListQuery {
  readonly status: ClientStatus | null;
  readonly query: string;
  readonly pageIndex: number;
  readonly pageSize: number;
}
