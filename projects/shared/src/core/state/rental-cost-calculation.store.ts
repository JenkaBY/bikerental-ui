import { computed, inject, Injectable } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import type { CostCalculationV2Request } from '@api-models';
import type { RentalCostEstimate } from '@ui-models';
import { CostCalculationMapper } from '../mappers/cost-calculation.mapper';
import { TariffStore } from './tariff.store';
import { RentalStore } from './rental.store';

@Injectable()
export class RentalCostCalculationStore {
  private readonly tariffStore = inject(TariffStore);
  private readonly rentalStore = inject(RentalStore);
  private readonly costCalculationMapper = inject(CostCalculationMapper);

  private readonly calculationRequest = computed(() => {
    const s = this.rentalStore.state();
    if (s.equipmentItems.length === 0) return null;
    if (s.specialPriceEnabled && !s.specialPrice) return null;
    return this.costCalculationMapper.fromState(s, this.tariffStore.specialTariffId());
  });

  readonly resource = rxResource<RentalCostEstimate | null, CostCalculationV2Request | null>({
    params: () => this.calculationRequest(),
    stream: ({ params }: { params: CostCalculationV2Request | null }) => {
      if (!params) return of(null);
      return timer(300).pipe(
        switchMap(() => this.tariffStore.calculateCost(params)),
        map((res) => this.costCalculationMapper.fromResponse(res)),
        catchError(() => of(null)),
      );
    },
  });

  readonly estimate = computed(() => this.resource.value());
  readonly isCalculating = this.resource.isLoading;
}
