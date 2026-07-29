import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Labels,
  MoneyPipe,
  NotificationService,
  RentalCostCalculationStore,
  RentalStore,
  RentalTransactionsStore,
} from '@bikerental/shared';
import { ChangePriceSheetComponent } from './change-price-sheet.component';
import { RentalPriceModeBadgeComponent } from './rental-price-mode-badge.component';

@Component({
  selector: 'app-rental-cost-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MoneyPipe,
    RentalPriceModeBadgeComponent,
  ],
  template: `
    <div class="px-4 py-3 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-slate-500">{{ sectionLabel() }}</span>
          <app-rental-price-mode-badge
            [mode]="rentalStore.priceMode()"
            [discountPercent]="rentalStore.discountPercent()"
            [interactive]="rentalStore.isActive()"
            (pressed)="onChangePrice()"
          />
        </div>

        @if (costStore.isCalculating()) {
          <div class="flex justify-center py-2">
            <mat-spinner diameter="28" />
          </div>
        } @else if (costStore.totalCost(); as total) {
          <div class="flex items-baseline gap-3 mt-1">
            <p class="text-2xl font-bold text-slate-900">{{ total | money }}</p>
            @if (transactionsStore.reserved(); as reserved) {
              <p class="text-sm text-slate-400">{{ reserved | money }}</p>
            }
          </div>
        }
      </div>

      <button
        mat-icon-button
        class="icon-btn-sm"
        [attr.aria-label]="Labels.Refresh"
        (click)="onRefresh()"
      >
        <mat-icon>refresh</mat-icon>
      </button>
    </div>
  `,
})
export class RentalCostSectionComponent {
  protected readonly costStore = inject(RentalCostCalculationStore);
  protected readonly rentalStore = inject(RentalStore);
  protected readonly transactionsStore = inject(RentalTransactionsStore);
  private readonly bottomSheet = inject(MatBottomSheet);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly Labels = Labels;

  protected readonly sectionLabel = computed(() =>
    this.costStore.isFinal() ? Labels.FinalCost : Labels.CurrentCost,
  );

  protected onRefresh(): void {
    const id = this.rentalStore.id();
    if (id !== null) this.rentalStore.loadDetail(id);
  }

  protected onChangePrice(): void {
    this.bottomSheet
      .open(ChangePriceSheetComponent, { viewContainerRef: this.viewContainerRef })
      .afterDismissed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated: boolean | undefined) => {
        if (updated) this.notifications.success(Labels.PricingUpdateSuccess);
      });
  }
}
