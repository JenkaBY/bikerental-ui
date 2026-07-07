import { computed, inject, Injectable } from '@angular/core';
import { makeMoney } from '../mappers';
import { CustomerFinanceStore } from './customer-finance.store';
import { RentalCostCalculationStore } from './rental-cost-calculation.store';
import { RentalStore } from './rental.store';

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
    if (balance.amount >= 0) return null;
    return { amount: Math.round(Math.abs(balance.amount) * 100) / 100, currency: balance.currency };
  });
}
