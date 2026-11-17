export type ClientChangeKind = 'REGISTERED' | 'DETAILS_CHANGED' | 'STATUS_CHANGED';

export interface ClientFieldChange {
  readonly field: string;
  readonly previousValue: string | null;
  readonly newValue: string | null;
}

export interface ClientChange {
  readonly id: string;
  readonly kind: ClientChangeKind;
  readonly changedAt: Date;
  readonly changedBy: string | null;
  readonly reason: string | null;
  readonly changes: readonly ClientFieldChange[];
}

export interface ClientChangeRow {
  readonly change: ClientChange;
  readonly author: string;
}
