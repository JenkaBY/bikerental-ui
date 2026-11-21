export type ClientStatus = 'DRAFT' | 'ACTIVE' | 'SUSPENDED' | 'CLOSED';

export const CLIENT_STATUSES: readonly ClientStatus[] = ['DRAFT', 'ACTIVE', 'SUSPENDED', 'CLOSED'];

export type ClientStatusTarget = Exclude<ClientStatus, 'DRAFT'>;

export interface ClientStatusTransition {
  readonly target: ClientStatusTarget;
  readonly reasonRequired: boolean;
}

const CLIENT_TRANSITIONS: Readonly<Record<ClientStatus, readonly ClientStatusTarget[]>> = {
  DRAFT: ['ACTIVE', 'CLOSED'],
  ACTIVE: ['SUSPENDED', 'CLOSED'],
  SUSPENDED: ['ACTIVE', 'CLOSED'],
  CLOSED: [],
};

export function clientStatusTransitions(from: ClientStatus): readonly ClientStatusTransition[] {
  return CLIENT_TRANSITIONS[from].map((target) => ({
    target,
    reasonRequired: target === 'SUSPENDED' || target === 'CLOSED',
  }));
}

export interface ClientStatusWrite {
  readonly status: ClientStatusTarget;
  readonly reason: string;
}

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
