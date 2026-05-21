import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import type { CostCalculationRequest } from '@api-models';
import type { RentalCostEstimate } from '@ui-models';
import { RentalMapper } from '../mappers';
import { TariffStore } from './tariff.store';
import { RentalStore } from './rental.store';

@Injectable()
export class RentalCostCalculationStore {
  private readonly tariffStore = inject(TariffStore);
  private readonly rentalStore = inject(RentalStore);

  private readonly calculationRequest = computed(() => {
    const s = this.rentalStore.state();
    if (s.equipmentItems.length === 0) return null;
    if (s.specialPriceEnabled && !s.specialPrice) return null;
    return RentalMapper.toCostCalculation(s, this.tariffStore.specialTariffId());
  });

  readonly resource = rxResource<RentalCostEstimate | null, CostCalculationRequest | null>({
    params: () => this.calculationRequest(),
    stream: ({ params }: { params: CostCalculationRequest | null }) => {
      if (!params) return of(null);
      return timer(300).pipe(
        switchMap(() => this.tariffStore.calculateCost(params)),
        map((res) => RentalMapper.fromCostResponse(res)),
        catchError(() => of(null)),
      );
    },
  });

  readonly estimate = computed(() => this.resource.value());
  readonly isCalculating = this.resource.isLoading;
}
