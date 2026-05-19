import { InjectionToken, Signal } from '@angular/core';
import type { Customer, CustomerBalance } from '@ui-models';

export interface RentalStoreContract {
  readonly customer: Signal<Customer | null>;
  readonly customerBalance: Signal<CustomerBalance | null>;
  readonly isBalanceSufficient: Signal<boolean>;
}

export const RENTAL_STORE_TOKEN = new InjectionToken<RentalStoreContract>('RentalStoreContract');
