import { InjectionToken, Signal } from '@angular/core';
import type { Customer, CustomerBalance } from '@ui-models';

export interface RentalStoreContract {
  readonly customer: Signal<Customer | null>;
  readonly customerBalance: Signal<CustomerBalance | null>;
  readonly isBalanceSufficient: Signal<boolean>;

  readonly specialPriceEnabled: Signal<boolean>;
  readonly isSelectedAnyEquipment: Signal<boolean>;
  readonly specialPrice: Signal<number | null>;
  readonly discountPercent: Signal<number | null>;

  setSpecialPriceEnabled(value: boolean): void;

  setSpecialPrice(value: number | null): void;

  setDiscountPercent(value: number | null): void;
}

export const RENTAL_STORE_TOKEN = new InjectionToken<RentalStoreContract>('RentalStoreContract');
