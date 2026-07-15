import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels, MoneyPipe, RentalCostCalculationStore, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-cost-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatDividerModule, MatIconModule, MatProgressSpinnerModule, MoneyPipe],
  template: `
    <div class="px-4 py-3 flex items-center justify-between">
      <div>
        <span class="text-sm font-medium text-slate-500">{{ sectionLabel() }}</span>

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

  protected readonly Labels = Labels;

  protected readonly sectionLabel = computed(() =>
    this.costStore.isFinal() ? Labels.FinalCost : Labels.CurrentCost,
  );

  protected onRefresh(): void {
    const id = this.rentalStore.id();
    if (id !== null) this.rentalStore.loadDetail(id);
  }
}
