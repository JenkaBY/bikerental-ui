import type { RentalDetailSnapshot } from '../state/rental.state';

export type ReturnableRental = RentalDetailSnapshot & {
  readonly atThisPoint: boolean;
};

export type ReturnLookupKey = { equipmentUid: string } | { customerId: string };

export type ReturnLookupOutcome = 'idle' | 'found' | 'empty' | 'notFound';
