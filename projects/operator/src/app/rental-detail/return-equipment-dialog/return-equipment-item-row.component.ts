import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels, MoneyPipe } from '@bikerental/shared';
import type { RentalCostBreakdown, RentalEquipmentItem } from '@bikerental/shared';

@Component({
  selector: 'app-return-equipment-item-row',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule, MoneyPipe],
  template: `
    <div class="flex items-center gap-3 px-3 py-2 border-b border-slate-100 last:border-b-0">
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-slate-800 truncate">{{ item().model }}</p>
        <p class="text-xs text-slate-500 truncate">{{ item().type.name }} · {{ item().uid }}</p>
      </div>
      <div class="text-right shrink-0">
        <p class="text-xs text-slate-400">
          {{ Labels.EstimatedCost }}: {{ item().estimatedCost | money }}
        </p>
        @if (isCalculating()) {
          <mat-spinner diameter="16" />
        } @else if (breakdown(); as bd) {
          <p class="text-sm font-semibold text-slate-900">
            {{ Labels.CurrentCost }}: {{ bd.itemCost | money }}
          </p>
          @if (bd.calculationMessage) {
            <p class="text-xs text-slate-400 mt-0.5">{{ bd.calculationMessage }}</p>
          }
        }
      </div>
    </div>
  `,
})
export class ReturnEquipmentItemRowComponent {
  readonly item = input.required<RentalEquipmentItem>();
  readonly breakdown = input<RentalCostBreakdown | null>(null);
  readonly isCalculating = input(false);

  protected readonly Labels = Labels;
}
