import { computed, inject, Injectable } from '@angular/core';
import { makeMoney } from '../mappers';
import { CustomerFinanceStore, RentalCostCalculationStore, RentalStore } from '@bikerental/shared';

@Injectable()
export class RentalValidationStore {
  private readonly rentalStore = inject(RentalStore);
  private readonly costStore = inject(RentalCostCalculationStore);
  private readonly financeStore = inject(CustomerFinanceStore);

  readonly projectedBalance = computed(() => {
    const balance = this.financeStore.balance()?.available.amount ?? 0;
    const cost = this.costStore.estimate()?.totalCost.amount ?? 0;
    return makeMoney(balance - cost);
  });

  readonly isBalanceSufficient = computed(() => this.projectedBalance().amount >= 0);

  readonly canProceed = computed(() => {
    const s = this.rentalStore.state();
    const hasItems = s.equipmentItems.length > 0;
    const hasEstimate = !!this.costStore.estimate();
    const specialValid = !s.specialPriceEnabled || s.specialPrice !== undefined;

    return hasItems && hasEstimate && specialValid && !this.costStore.isCalculating();
  });

  readonly estimate = computed(() => this.costStore.estimate());

  readonly balanceShortfall = computed(() => {
    const balance = this.projectedBalance();
    if (!balance) return null;
    return { amount: Math.abs(balance.amount), currency: balance.currency };
  });
}
