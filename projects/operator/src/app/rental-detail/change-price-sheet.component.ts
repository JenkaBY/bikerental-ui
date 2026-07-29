import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  ApiErrorParser,
  ErrorCode,
  ErrorMessageResolver,
  Labels,
  MoneyPipe,
  NotificationService,
  RentalPricingStore,
  RentalStore,
  resolveGeneralErrors,
} from '@bikerental/shared';
import { RentalPriceControlComponent } from '../pricing/rental-price-control.component';

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
  providers: [RentalPricingStore],
  template: `
    <div class="px-4 pt-4 pb-2">
      <h2 class="text-base font-bold text-slate-900">{{ Labels.ChangePriceTitle }}</h2>
      <p class="text-sm text-slate-500 mt-0.5">{{ Labels.ChangePriceSubtitle }}</p>
    </div>

    <mat-divider />

    <div class="px-4 py-3 flex flex-col gap-3">
      <app-rental-price-control
        [value]="store.draft()"
        [estimate]="store.estimate()"
        [fixedPrefill]="store.fixedPrefill()"
        [isCalculating]="store.isCalculating()"
        (valueChange)="store.setDraft($event)"
      />

      @if (store.draft().mode === 'FIXED' && !store.specialTariffId()) {
        <p class="text-xs text-amber-600">{{ Labels.SpecialTariffNotConfigured }}</p>
      }

      @if (store.returnedItems().length > 0) {
        <div class="flex justify-between text-xs text-slate-400">
          <span>{{ Labels.ReturnedEquipment }}</span>
          <span>{{ store.returnedTotal() | money }}</span>
        </div>
      }

      @for (message of generalErrors(); track message) {
        <p class="text-xs text-red-600">{{ message }}</p>
      }
    </div>

    <mat-divider />

    <div class="flex gap-3 px-4 py-3">
      <button
        mat-stroked-button
        class="flex-1"
        [disabled]="store.isSubmitting()"
        (click)="onClose()"
      >
        {{ Labels.Close }}
      </button>
      <button
        mat-flat-button
        color="primary"
        class="flex-1"
        [disabled]="!store.canSubmit() || store.isSubmitting()"
        (click)="onUpdate()"
      >
        @if (store.isSubmitting()) {
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
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly store = inject(RentalPricingStore);
  protected readonly Labels = Labels;

  protected readonly generalErrors = signal<string[]>([]);

  protected onClose(): void {
    this.sheetRef.dismiss(false);
  }

  protected onUpdate(): void {
    if (!this.store.canSubmit()) return;
    this.generalErrors.set([]);
    this.sheetRef.disableClose = true;
    this.store
      .submit()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.sheetRef.dismiss(true),
        error: (err: unknown) => this.handleError(err),
      });
  }

  private handleError(err: unknown): void {
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
