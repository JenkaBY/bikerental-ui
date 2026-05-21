import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import {
  Labels,
  makeMoney,
  MoneyPipe,
  RentalCostCalculationStore,
  RentalStore,
  RentalValidationStore,
} from '@bikerental/shared';

@Component({
  selector: 'app-rental-cost-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule, MatChipsModule, MoneyPipe],
  template: `
    <div class="bg-white border-t border-slate-200 shadow-lg px-4 py-3 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-600">{{ Labels.TotalCost }}</span>
        @if (costStore.estimate(); as cost) {
          <span class="font-semibold text-slate-900">
            {{ cost.totalCost | money }}
          </span>
        } @else if (costStore.isCalculating()) {
          <mat-spinner diameter="20" />
        } @else {
          <span class="text-slate-500">{{ this.makeMoney(0) | money }}</span>
        }
      </div>

      @let isBalanceSufficient = validationStore.isBalanceSufficient();
      @let isSavingRental = rentalStore.isSaving();

      @if (validationStore.projectedBalance(); as projected) {
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">{{ Labels.ProjectedBalance }}</span>
          <span class="font-medium" [class.text-red-600]="!isBalanceSufficient">
            {{ projected | money }}
          </span>
        </div>
      }

      @if (!isBalanceSufficient) {
        <div class="text-xs font-medium text-red-600 bg-red-50 rounded px-2 py-1">
          {{ Labels.InsufficientBalance }}
        </div>
      }

      <div class="flex gap-2 mt-1">
        <button
          mat-stroked-button
          type="button"
          class="flex-1"
          [disabled]="isSavingRental"
          (click)="saveDraftRequested.emit()"
        >
          @if (isSavingRental) {
            {{ Labels.Saving }}
          } @else {
            {{ Labels.SaveDraft }}
          }
        </button>
        <button
          mat-flat-button
          color="primary"
          type="button"
          class="flex-1"
          [disabled]="!validationStore.canProceed() || isSavingRental"
          (click)="nextRequested.emit()"
        >
          {{ Labels.Next }}
        </button>
      </div>
    </div>
  `,
})
export class RentalCostFooterComponent {
  protected readonly rentalStore = inject(RentalStore);
  protected readonly validationStore = inject(RentalValidationStore);
  protected readonly costStore = inject(RentalCostCalculationStore);
  protected readonly Labels = Labels;

  readonly nextRequested = output<void>();
  readonly saveDraftRequested = output<void>();
  protected readonly makeMoney = makeMoney;
}
