import { computed, inject, Injectable, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { EMPTY, Observable, of, timer } from 'rxjs';
import { catchError, finalize, map, switchMap, tap } from 'rxjs/operators';
import type { CostCalculationV2Request } from '@api-models';
import type {
  Money,
  RentalCostBreakdown,
  RentalCostEstimate,
  RentalEquipmentItem,
  ReturnSettlement,
} from '@ui-models';
import { FinanceService } from '../api/generated';
import { CostCalculationMapper } from '../mappers/cost-calculation.mapper';
import { TransactionMapper } from '../mappers/transaction.mapper';
import { makeMoney } from '../mappers/money.mapper';
import { toIsoDate } from '../../shared/utils/date.util';
import { TariffStore } from './tariff.store';
import { RentalStore } from './rental.store';

interface HeldAmountParams {
  rentalId: number;
  customerId: string;
  startedAt: Date | null;
}

@Injectable()
export class ReturnEquipmentCostStore {
  private readonly tariffStore = inject(TariffStore);
  private readonly rentalStore = inject(RentalStore);
  private readonly costCalculationMapper = inject(CostCalculationMapper);
  private readonly financeService = inject(FinanceService);

  private readonly _quoteMode = signal(false);
  private readonly _quoteId = signal<string | null>(null);
  private readonly _quoteExpiresAt = signal<Date | null>(null);
  private readonly _frozenEstimate = signal<RentalCostEstimate | null>(null);
  private readonly _quoteLoading = signal(false);

  readonly quoteId = this._quoteId.asReadonly();
  readonly expiresAt = this._quoteExpiresAt.asReadonly();

  readonly selectedItems = computed<RentalEquipmentItem[]>(() => {
    const selectedIds = this.rentalStore.selectedEquipmentItemIds();
    return this.rentalStore.rentalEquipmentItems().filter((item) => selectedIds.has(item.id));
  });

  private buildRequest(): CostCalculationV2Request | null {
    const s = this.rentalStore.state();
    // Full-return quotes must cover every equipment item ever attached to the rental —
    // including ones already returned in an earlier partial return — or the backend
    // rejects the quote as not matching the rental's equipment set (rental.quote.mismatch).
    // The live/partial-return preview only ever needs the currently-selected items.
    const items = this._quoteMode()
      ? this.rentalStore.rentalEquipmentItems()
      : this.selectedItems();
    if (items.length === 0) return null;
    return this.costCalculationMapper.fromState(
      { ...s, equipmentItems: items, specialPriceEnabled: false, specialPrice: undefined },
      null,
    );
  }

  private readonly calculationRequest = computed<CostCalculationV2Request | null>(() =>
    this._quoteMode() ? null : this.buildRequest(),
  );

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

  readonly estimate = computed(() =>
    this._quoteMode() ? this._frozenEstimate() : (this.resource.value() ?? null),
  );
  readonly isCalculating = computed(() =>
    this._quoteMode() ? this._quoteLoading() : this.resource.isLoading(),
  );

  enterQuoteMode(): void {
    this._quoteMode.set(true);
  }

  createQuote(): Observable<void> {
    const request = this.buildRequest();
    if (!request) return of(undefined);
    this._quoteLoading.set(true);
    return this.tariffStore.createQuote(request).pipe(
      tap((response) => {
        const quote = this.costCalculationMapper.fromQuoteResponse(response);
        this._quoteId.set(quote.quoteId);
        this._quoteExpiresAt.set(quote.expiresAt);
        this._frozenEstimate.set(quote.estimate);
      }),
      map(() => undefined as void),
      finalize(() => this._quoteLoading.set(false)),
    );
  }

  // Fire-and-forget: the operator is abandoning the quote, so we don't block the UI
  // on the backend's response — a failed/late delete just leaves the quote to expire.
  deleteQuote(): void {
    const quoteId = this._quoteId();
    if (!quoteId) return;
    this.tariffStore
      .deleteQuote(quoteId)
      .pipe(catchError(() => EMPTY))
      .subscribe();
  }

  readonly breakdownByEquipmentId = computed<Map<number, RentalCostBreakdown>>(() => {
    const map = new Map<number, RentalCostBreakdown>();
    for (const breakdown of this.estimate()?.equipmentBreakdowns ?? []) {
      if (breakdown.equipmentId != null) map.set(breakdown.equipmentId, breakdown);
    }
    return map;
  });

  readonly totalCurrent = computed<Money | null>(() => this.estimate()?.totalCost ?? null);

  private readonly heldAmountParams = computed<HeldAmountParams | null>(() => {
    const rentalId = this.rentalStore.id();
    const customerId = this.rentalStore.customerId();
    if (rentalId === null || !customerId) return null;
    return { rentalId, customerId, startedAt: this.rentalStore.startedAt() };
  });

  private readonly heldAmountResource = rxResource<Money | null, HeldAmountParams | null>({
    params: () => this.heldAmountParams(),
    stream: ({ params }: { params: HeldAmountParams | null }) => {
      if (!params) return of(null);
      const fromDate = toIsoDate(params.startedAt ?? new Date(0));
      const toDate = toIsoDate(new Date());
      return this.financeService
        .getTransactionHistory(
          params.customerId,
          { fromDate, toDate, sourceId: String(params.rentalId), sourceType: 'RENTAL' },
          { page: 0, size: 100 },
        )
        .pipe(
          map((page) => makeMoney(TransactionMapper.latestHoldAmount(page.items ?? []))),
          catchError(() => of(null)),
        );
    },
  });

  // The rental-scoped HOLD transaction from the ledger — the amount actually reserved
  // for this specific rental (not the customer's account-wide reserved balance).
  readonly heldAmount = computed<Money | null>(() => this.heldAmountResource.value() ?? null);

  readonly settlement = computed<ReturnSettlement | null>(() => {
    const current = this.totalCurrent();
    const held = this.heldAmount();
    if (!current || !held) return null;
    const diff = held.amount - current.amount;
    const amount = makeMoney(Math.abs(diff), current.currency);
    if (diff > 0) return { kind: 'refund', amount };
    if (diff < 0) return { kind: 'collect', amount };
    return { kind: 'none', amount };
  });
}
