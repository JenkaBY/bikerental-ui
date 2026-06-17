import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels, MoneyPipe } from '@bikerental/shared';
import type {
  Money,
  RentalCostEstimate,
  ReturnSettlement,
  ReturnSettlementKind,
} from '@bikerental/shared';

@Component({
  selector: 'app-return-settlement-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDividerModule, MatProgressSpinnerModule, MoneyPipe],
  template: `
    <div class="flex flex-col gap-1">
      @if (isCalculating()) {
        <div class="flex justify-center py-2">
          <mat-spinner diameter="20" />
        </div>
      } @else if (cost(); as c) {
        <div class="flex justify-between text-sm text-slate-500">
          <span>{{ Labels.Subtotal }}</span>
          <span>{{ c.subtotal | money }}</span>
        </div>

        @if (c.discountPercent) {
          <div class="flex justify-between text-sm text-slate-600">
            <span>{{ Labels.DiscountLabel }} −{{ c.discountPercent }}%</span>
            <span>−{{ c.discountAmount | money }}</span>
          </div>
        }

        <div class="flex justify-between text-base font-semibold text-slate-900">
          <span>{{ Labels.FinalCost }}</span>
          <span>{{ c.totalCost | money }}</span>
        </div>

        <mat-divider class="!my-1" />

        <div class="flex justify-between text-sm text-slate-500">
          <span>{{ Labels.TotalEstimated }}</span>
          <span>{{ totalEstimated() | money }}</span>
        </div>

        @if (settlement(); as s) {
          <div
            class="flex justify-between text-sm font-semibold mt-1"
            [class.text-green-700]="s.kind === 'refund'"
            [class.text-red-600]="s.kind === 'collect'"
            [class.text-slate-500]="s.kind === 'none'"
          >
            <span>{{ settlementLabel(s.kind) }}</span>
            @if (s.kind !== 'none') {
              <span>{{ s.amount | money }}</span>
            }
          </div>
        }
      }
    </div>
  `,
})
export class ReturnSettlementSummaryComponent {
  readonly totalEstimated = input.required<Money>();
  readonly cost = input<RentalCostEstimate | null>(null);
  readonly settlement = input<ReturnSettlement | null>(null);
  readonly isCalculating = input(false);

  protected readonly Labels = Labels;

  protected settlementLabel(kind: ReturnSettlementKind): string {
    switch (kind) {
      case 'refund':
        return Labels.AmountToRefund;
      case 'collect':
        return Labels.AmountToCollect;
      default:
        return Labels.NoSettlementNeeded;
    }
  }
}
