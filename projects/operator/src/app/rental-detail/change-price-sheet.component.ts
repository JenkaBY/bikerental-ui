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
import { of, timer } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
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

      <div class="flex justify-between items-center pt-1 border-t border-slate-100">
        <span class="text-sm font-medium text-slate-700">{{ Labels.NewTotal }}</span>
        @if (newTotal(); as total) {
          <span class="text-base font-semibold text-slate-900">{{ total | money }}</span>
        } @else {
          <mat-spinner diameter="18" />
        }
      </div>

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

  private readonly previewRequest = computed<PreviewRequest | null>(() => {
    const d = this.draft();
    if (d.mode === 'FIXED') return null;
    const active = this.activeItems();
    if (active.length === 0) return null;
    const state = this.rentalStore.state();
    return this.costCalculationMapper.fromState(
      {
        ...state,
        equipmentItems: active,
        priceMode: d.mode,
        discountPercent: d.mode === 'DISCOUNT' ? (d.discountPercent ?? 0) : undefined,
        specialPrice: undefined,
      },
      this.tariffStore.specialTariffId(),
    );
  });

  private readonly preview = rxResource<RentalCostEstimate | null, PreviewRequest | null>({
    params: () => this.previewRequest(),
    stream: ({ params }) => {
      if (!params) return of(null);
      return timer(300).pipe(
        switchMap(() => this.tariffStore.calculateCost(params)),
        map((res) => this.costCalculationMapper.fromResponse(res)),
        catchError(() => of(null)),
      );
    },
  });

  protected readonly estimate = computed(() => this.preview.value() ?? null);
  protected readonly isCalculating = this.preview.isLoading;

  protected readonly newTotal = computed<Money | null>(() => {
    const d = this.draft();
    if (d.mode === 'FIXED') {
      return d.specialPrice != null
        ? makeMoney(d.specialPrice, this.returnedTotal().currency)
        : null;
    }
    const active = this.activeItems();
    if (active.length === 0) {
      return this.returnedItems().length > 0 ? this.returnedTotal() : null;
    }
    const est = this.estimate();
    if (!est) return null;
    return makeMoney(this.returnedTotal().amount + est.totalCost.amount, est.totalCost.currency);
  });

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
