import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';
import {
  BusinessCurrencyStore,
  FixedMoneyPipe,
  formatFixedMoney,
  Labels,
  pointDepositedSplit,
  pointDepositedToBankTitle,
  type PointMoneySummary,
} from '@bikerental/shared';

@Component({
  selector: 'app-point-money-summary-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FixedMoneyPipe],
  template: `
    <div class="grid grid-cols-3 gap-4">
      <div class="p-4 border border-slate-200 rounded-lg bg-white">
        <div class="text-sm text-slate-500">{{ labels.PointSummaryCash }}</div>
        <div class="text-2xl font-semibold text-slate-800 tabular-nums">
          {{ summary().cash | fixedMoney }}
        </div>
      </div>
      <div class="p-4 border border-slate-200 rounded-lg bg-white">
        <div class="text-sm text-slate-500">{{ labels.PointSummaryTerminal }}</div>
        <div class="text-2xl font-semibold text-slate-800 tabular-nums">
          {{ summary().terminal | fixedMoney }}
        </div>
      </div>
      <div class="p-4 border border-slate-200 rounded-lg bg-white">
        <div class="text-sm text-slate-500">{{ depositedTitle() }}</div>
        <div class="text-2xl font-semibold text-slate-800 tabular-nums">
          {{ summary().deposited | fixedMoney }}
        </div>
        @if (split(); as text) {
          <div class="text-xs text-slate-500 mt-1 tabular-nums">{{ text }}</div>
        }
      </div>
    </div>
  `,
})
export class PointMoneySummaryCardsComponent {
  protected readonly labels = Labels;
  private readonly locale = inject(LOCALE_ID);
  private readonly currency = inject(BusinessCurrencyStore);

  readonly summary = input.required<PointMoneySummary>();

  protected readonly depositedTitle = computed(() =>
    pointDepositedToBankTitle(this.summary().monthName),
  );

  protected readonly split = computed(() => {
    const { collected, terminalSettled } = this.summary();
    if (!collected || !terminalSettled) return null;
    return pointDepositedSplit(
      formatFixedMoney(collected, this.locale, this.currency.symbol()),
      formatFixedMoney(terminalSettled, this.locale, this.currency.symbol()),
    );
  });
}
