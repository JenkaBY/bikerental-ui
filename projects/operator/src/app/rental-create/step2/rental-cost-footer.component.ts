import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Labels, makeMoney, MoneyPipe, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-cost-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatProgressSpinnerModule, MatChipsModule, MoneyPipe],
  template: `
    <div class="bg-white border-t border-slate-200 shadow-lg px-4 py-3 flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <span class="text-sm text-slate-600">{{ Labels.TotalCost }}</span>
        @if (store.costEstimate(); as cost) {
          <span class="font-semibold text-slate-900">
            {{ cost.totalCost | money }}
          </span>
        } @else if (store.isCalculatingCost()) {
          <mat-spinner diameter="20" />
        } @else {
          <span class="text-slate-500">{{ this.makeMoney(0) | money }}</span>
        }
      </div>

      @if (store.projectedBalance(); as projected) {
        <div class="flex items-center justify-between">
          <span class="text-sm text-slate-600">{{ Labels.ProjectedBalance }}</span>
          <span class="font-medium" [class.text-red-600]="!store.isBalanceSufficient()">
            {{ projected | money }}
          </span>
        </div>
      }

      @if (!store.isBalanceSufficient()) {
        <div class="text-xs font-medium text-red-600 bg-red-50 rounded px-2 py-1">
          {{ Labels.InsufficientBalance }}
        </div>
      }

      <div class="flex gap-2 mt-1">
        <button
          mat-stroked-button
          type="button"
          class="flex-1"
          [disabled]="store.isSaving()"
          (click)="saveDraftRequested.emit()"
        >
          @if (store.isSaving()) {
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
          [disabled]="!store.canProceedFromStep2() || store.isSaving()"
          (click)="nextRequested.emit()"
        >
          {{ Labels.Next }}
        </button>
      </div>
    </div>
  `,
})
export class RentalCostFooterComponent {
  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;

  readonly nextRequested = output<void>();
  readonly saveDraftRequested = output<void>();
  protected readonly makeMoney = makeMoney;
}
