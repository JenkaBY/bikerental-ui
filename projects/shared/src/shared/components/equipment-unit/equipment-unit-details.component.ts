import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Money, RentalCostBreakdown } from '../../../core/models';
import { Labels } from '../../constant/labels';
import { MoneyPipe } from '../../pipes/money.pipe';
import { CostBreakdownComponent } from '../cost-breakdown/cost-breakdown.component';

@Component({
  selector: 'app-equipment-unit-details',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe, CostBreakdownComponent],
  template: `
    <div class="mt-1 flex flex-col gap-0.5 border-t border-slate-100 pt-1 leading-tight">
      <div class="flex justify-between gap-3 text-sm text-slate-600">
        <span>{{ Labels.PlannedCost }}</span>
        <span class="font-medium">{{
          plannedCost() ? (plannedCost() | money) : Labels.NotAvailable
        }}</span>
      </div>
      @if (returnPointName(); as pointName) {
        <div class="flex justify-between gap-3 text-sm text-slate-600">
          <span class="shrink-0">{{ Labels.ReturnPoint }}</span>
          <span class="min-w-0 truncate font-medium" [title]="pointName">{{ pointName }}</span>
        </div>
      }
      <app-cost-breakdown [breakdown]="breakdown()" />
    </div>
  `,
})
export class EquipmentUnitDetailsComponent {
  readonly plannedCost = input<Money | null>(null);
  readonly breakdown = input<RentalCostBreakdown | null>(null);
  readonly returnPointName = input<string | null>(null);
  protected readonly Labels = Labels;
}
