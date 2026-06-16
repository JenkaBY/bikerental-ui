import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { RentalCostBreakdown } from '@ui-models';
import { Labels, MoneyPipe, RentalCostCalculationStore, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-cost-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalCostCalculationStore],
  imports: [MatButtonModule, MatDividerModule, MatProgressSpinnerModule, MoneyPipe, DatePipe],
  template: `
    <div class="px-4 py-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-slate-500">{{ sectionLabel() }}</span>
        <button matButton (click)="toggleExpanded()" class="text-xs text-slate-400">
          @if (expanded()) {
            {{ Labels.CollapseDetails }} ▴
          } @else {
            {{ Labels.ShowDetails }} ▾
          }
        </button>
      </div>

      @if (costStore.isCalculating()) {
        <div class="flex justify-center py-2">
          <mat-spinner diameter="28" />
        </div>
      } @else if (costStore.totalCost(); as total) {
        <div class="flex items-baseline gap-3 mt-1">
          <p class="text-2xl font-bold text-slate-900">{{ total | money }}</p>
          <p class="text-sm text-slate-400">{{ rentalStore.estimatedCost() | money }}</p>
        </div>
      }

      @if (expanded() && costStore.totalCost(); as total) {
        <div class="mt-2 space-y-1">
          @for (item of rentalStore.rentalEquipmentItems(); track item.id) {
            @if (breakdownFor(item.id); as bd) {
              <div
                class="flex justify-between gap-3 border-b border-slate-100 pb-1 text-xs text-slate-500 last:border-b-0 last:pb-0"
              >
                <span class="min-w-0">
                  {{ item.model }}&nbsp;·&nbsp;{{ bd.calculationMessage }}
                  @if (item.isReturned && item.returnedAt; as returnedAt) {
                    <span class="text-slate-400"
                      >({{ Labels.ReturnedAt }}: {{ returnedAt | date: 'short' }})</span
                    >
                  }
                </span>
                <span class="shrink-0 whitespace-nowrap">{{ bd.itemCost | money }}</span>
              </div>
            }
          }

          @if (costStore.estimate(); as cost) {
            <mat-divider class="!my-2" />

            <div class="flex justify-between text-sm text-slate-600">
              <span>{{ Labels.Subtotal }}</span>
              <span>{{ cost.subtotal | money }}</span>
            </div>

            @if (cost.discountPercent) {
              <div class="flex justify-between text-sm text-slate-600">
                <span>{{ Labels.DiscountLabel }}&nbsp;−{{ cost.discountPercent }}%</span>
                <span>−{{ cost.discountAmount | money }}</span>
              </div>
            }

            @if (cost.specialPricingApplied) {
              <div class="text-sm text-slate-600">{{ Labels.SpecialPriceApplied }}</div>
            }
          }

          <mat-divider class="!my-2" />

          <div class="flex justify-between text-sm font-semibold text-slate-900">
            <span>{{ Labels.Total }}</span>
            <span>{{ total | money }}</span>
          </div>
        </div>
      }
    </div>
  `,
})
export class RentalCostSectionComponent {
  protected readonly costStore = inject(RentalCostCalculationStore);
  protected readonly rentalStore = inject(RentalStore);

  protected readonly Labels = Labels;
  protected readonly expanded = signal(false);

  protected readonly sectionLabel = computed(() =>
    this.costStore.isFinal() ? Labels.FinalCost : Labels.CurrentCost,
  );

  protected toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  protected breakdownFor(equipmentId: number): RentalCostBreakdown | null {
    return this.costStore.breakdowns().find((b) => b.equipmentId === equipmentId) ?? null;
  }
}
