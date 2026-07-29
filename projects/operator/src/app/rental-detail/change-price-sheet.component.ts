import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, rxResource } from '@angular/core/rxjs-interop';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of, timer, type Observable } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import {
  ApiErrorParser,
  CostCalculationMapper,
  ErrorCode,
  ErrorMessageResolver,
  Labels,
  makeMoney,
  MoneyPipe,
  NotificationService,
  RentalStore,
  resolveGeneralErrors,
  TariffStore,
} from '@bikerental/shared';
import type {
  Money,
  RentalCostEstimate,
  RentalEquipmentItem,
  RentalPricingDraft,
} from '@bikerental/shared';
import { RentalPriceControlComponent } from '../pricing/rental-price-control.component';

type PreviewRequest = ReturnType<CostCalculationMapper['fromState']>;

const DISCOUNT_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-change-price-sheet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MoneyPipe,
    RentalPriceControlComponent,
  ],
  template: `
    <div class="px-4 pt-4 pb-2">
      <h2 class="text-base font-bold text-slate-900">{{ Labels.ChangePriceTitle }}</h2>
      <p class="text-sm text-slate-500 mt-0.5">{{ Labels.ChangePriceSubtitle }}</p>
    </div>

    <mat-divider />

    <div class="px-4 py-3 flex flex-col gap-3">
      <app-rental-price-control
        [value]="draft()"
        [estimate]="estimate()"
        [fixedPrefill]="fixedPrefill()"
        [isCalculating]="isCalculating()"
        (valueChange)="draft.set($event)"
      />

      @if (draft().mode === 'FIXED' && !specialTariffId()) {
        <p class="text-xs text-amber-600">{{ Labels.SpecialTariffNotConfigured }}</p>
      }

      @if (returnedItems().length > 0) {
        <div class="flex justify-between text-xs text-slate-400">
          <span>{{ Labels.ReturnedEquipment }}</span>
          <span>{{ returnedTotal() | money }}</span>
        </div>
      }

      @for (message of generalErrors(); track message) {
        <p class="text-xs text-red-600">{{ message }}</p>
      }
    </div>

    <mat-divider />

    <div class="flex gap-3 px-4 py-3">
      <button mat-stroked-button class="flex-1" [disabled]="isSubmitting()" (click)="onClose()">
        {{ Labels.Close }}
      </button>
      <button
        mat-flat-button
        color="primary"
        class="flex-1"
        [disabled]="!canSubmit() || isSubmitting()"
        (click)="onUpdate()"
      >
        @if (isSubmitting()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ Labels.Update }}
        }
      </button>
    </div>
  `,
})
export class ChangePriceSheetComponent {
  private readonly sheetRef = inject(MatBottomSheetRef<ChangePriceSheetComponent, boolean>);
  private readonly rentalStore = inject(RentalStore);
  private readonly tariffStore = inject(TariffStore);
  private readonly costCalculationMapper = inject(CostCalculationMapper);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly Labels = Labels;

  protected readonly draft = signal<RentalPricingDraft>({
    mode: this.rentalStore.priceMode(),
    discountPercent: this.rentalStore.discountPercent(),
    specialPrice: this.rentalStore.specialPrice(),
  });

  protected readonly generalErrors = signal<string[]>([]);
  protected readonly isSubmitting = signal(false);

  protected readonly specialTariffId = computed(
    () => this.tariffStore.specialTariffId() ?? this.rentalStore.specialTariffId(),
  );

  protected readonly activeItems = computed<RentalEquipmentItem[]>(() =>
    this.rentalStore.rentalEquipmentItems().filter((item) => !item.isReturned),
  );

  protected readonly returnedItems = computed<RentalEquipmentItem[]>(() =>
    this.rentalStore.rentalEquipmentItems().filter((item) => item.isReturned),
  );

  protected readonly returnedTotal = computed<Money>(() => {
    const items = this.returnedItems();
    const sum = items.reduce((acc, item) => acc + (item.finalCost?.amount ?? 0), 0);
    return makeMoney(sum, items[0]?.finalCost?.currency);
  });

  private readonly staleActiveSubtotal = computed(() =>
    this.activeItems().reduce((sum, item) => sum + (item.estimatedCost?.amount ?? 0), 0),
  );

  protected readonly fixedPrefill = computed(() => {
    const liveSubtotal = this.estimate()?.subtotal.amount;
    const activeSubtotal = liveSubtotal ?? this.staleActiveSubtotal();
    return this.returnedTotal().amount + activeSubtotal;
  });

  private readonly hasDiscountApplied = computed(() => {
    const d = this.draft();
    return d.mode === 'DISCOUNT' && (d.discountPercent ?? 0) > 0;
  });

  private readonly requestTemplate = this.buildRequestTemplate();
  private readonly needsOwnFullQuote = !this.hasDiscountApplied();
  private readonly lastQuote = signal<RentalCostEstimate | null>(null);

  private readonly fullQuote = rxResource<RentalCostEstimate | null, PreviewRequest | null>({
    params: () => (this.needsOwnFullQuote ? this.requestTemplate : null),
    stream: ({ params }) => this.quote(params),
  });

  private readonly discountRequest = computed<PreviewRequest | null>(() => {
    const d = this.draft();
    const percent = d.discountPercent ?? 0;
    if (d.mode !== 'DISCOUNT' || percent <= 0 || !this.requestTemplate) return null;
    return { ...this.requestTemplate, discountPercent: percent };
  });

  private readonly discountQuote = rxResource<RentalCostEstimate | null, PreviewRequest | null>({
    params: () => this.discountRequest(),
    stream: ({ params }) => {
      if (!params) return of(null);
      return timer(DISCOUNT_DEBOUNCE_MS).pipe(switchMap(() => this.quote(params)));
    },
  });

  private readonly fullPriceEstimate = computed<RentalCostEstimate | null>(() => {
    const quote = this.lastQuote();
    if (!quote) return null;
    return {
      ...quote,
      totalCost: quote.subtotal,
      discountPercent: 0,
      discountAmount: makeMoney(0, quote.subtotal.currency),
    };
  });

  protected readonly estimate = computed<RentalCostEstimate | null>(() =>
    this.hasDiscountApplied() ? (this.discountQuote.value() ?? null) : this.fullPriceEstimate(),
  );

  protected readonly isCalculating = computed(() =>
    this.hasDiscountApplied()
      ? this.discountQuote.isLoading()
      : this.fullQuote.isLoading() || this.discountQuote.isLoading(),
  );

  protected readonly canSubmit = computed(() => {
    const d = this.draft();
    switch (d.mode) {
      case 'FULL':
        return true;
      case 'DISCOUNT':
        return (
          d.discountPercent != null &&
          Number.isInteger(d.discountPercent) &&
          d.discountPercent >= 0 &&
          d.discountPercent <= 100
        );
      case 'FIXED':
        return d.specialPrice != null && d.specialPrice >= 0 && !!this.specialTariffId();
    }
  });

  protected onClose(): void {
    this.sheetRef.dismiss(false);
  }

  protected onUpdate(): void {
    if (!this.canSubmit()) return;
    this.generalErrors.set([]);
    this.isSubmitting.set(true);
    this.sheetRef.disableClose = true;
    this.rentalStore
      .updatePricing(this.draft(), this.specialTariffId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.sheetRef.dismiss(true),
        error: (err: unknown) => this.handleError(err),
      });
  }

  private buildRequestTemplate(): PreviewRequest | null {
    const active = this.activeItems();
    if (active.length === 0) return null;
    return this.costCalculationMapper.fromState(
      {
        ...this.rentalStore.state(),
        equipmentItems: active,
        priceMode: 'FULL',
        discountPercent: undefined,
        specialPrice: undefined,
      },
      this.tariffStore.specialTariffId(),
    );
  }

  private quote(request: PreviewRequest | null): Observable<RentalCostEstimate | null> {
    if (!request) return of(null);
    return this.tariffStore.calculateCost(request).pipe(
      map((res) => this.costCalculationMapper.fromResponse(res)),
      tap((estimate) => this.lastQuote.set(estimate)),
      catchError(() => of(null)),
    );
  }

  private handleError(err: unknown): void {
    this.isSubmitting.set(false);
    this.sheetRef.disableClose = false;
    const apiError = ApiErrorParser.parse(err);
    const general = resolveGeneralErrors(apiError);
    this.generalErrors.set(general);
    if (general.length === 0) {
      this.notifications.error(this.resolver.resolve(apiError));
    }

    if (
      apiError.code === ErrorCode.STATUS_INVALID ||
      apiError.code === ErrorCode.RESOURCE_NOT_FOUND
    ) {
      const id = this.rentalStore.id();
      if (id !== null) this.rentalStore.loadDetail(id);
      this.sheetRef.dismiss(false);
    }
  }
}
