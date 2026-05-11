import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { catchError, debounceTime, finalize, map, switchMap } from 'rxjs/operators';
import type { EquipmentSearchItem, RentalCostEstimate, RentalWrite } from '@ui-models';
import { RentalMapper } from '../mappers';
import { TariffStore } from './tariff.store';

interface CostInputs {
  items: EquipmentSearchItem[];
  durationMinutes: number;
  discountPercent: number | null;
  specialEnabled: boolean;
  specialPrice: number | null;
}

const DEFAULT_INPUTS: CostInputs = {
  items: [],
  durationMinutes: 0,
  discountPercent: null,
  specialEnabled: false,
  specialPrice: null,
};

@Injectable()
export class RentalCostCalculationStore {
  private readonly tariffStore = inject(TariffStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _inputs = signal<CostInputs>({ ...DEFAULT_INPUTS });
  private readonly _costEstimate = signal<RentalCostEstimate | null>(null);
  private readonly _isCalculatingCost = signal<boolean>(false);

  private readonly _costInputs = computed(() => ({
    ...this._inputs(),
    specialTariffId: this.tariffStore.specialTariffId(),
  }));

  readonly costEstimate = computed(() => this._costEstimate());
  readonly isCalculatingCost = computed(() => this._isCalculatingCost());

  constructor() {
    toObservable(this._costInputs)
      .pipe(
        switchMap((inputs) => {
          if (inputs.items.length === 0) {
            this._isCalculatingCost.set(false);
            return of(null);
          }
          return of(inputs).pipe(
            debounceTime(300),
            switchMap((debounced) => {
              this._isCalculatingCost.set(true);
              return this.tariffStore
                .calculateCost(
                  RentalMapper.toCostCalculationRequest(
                    {
                      durationMinutes: debounced.durationMinutes,
                      discountPercent: debounced.specialEnabled
                        ? undefined
                        : (debounced.discountPercent ?? undefined),
                      specialTariffId: debounced.specialEnabled
                        ? (debounced.specialTariffId ?? undefined)
                        : undefined,
                      specialPrice: debounced.specialEnabled
                        ? (debounced.specialPrice ?? undefined)
                        : undefined,
                    },
                    debounced.items.map((e) => e.type.slug),
                  ),
                )
                .pipe(
                  map((response) => RentalMapper.fromCostResponse(response)),
                  catchError(() => of(null)),
                  finalize(() => this._isCalculatingCost.set(false)),
                );
            }),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((estimate) => this._costEstimate.set(estimate));
  }

  updateInputs(
    items: EquipmentSearchItem[],
    draft: Pick<RentalWrite, 'durationMinutes' | 'discountPercent' | 'specialPrice'>,
    specialEnabled: boolean,
  ): void {
    this._inputs.set({
      items,
      durationMinutes: draft.durationMinutes,
      discountPercent: draft.discountPercent ?? null,
      specialEnabled,
      specialPrice: draft.specialPrice ?? null,
    });
  }

  reset(): void {
    this._inputs.set({ ...DEFAULT_INPUTS });
    this._costEstimate.set(null);
  }
}
