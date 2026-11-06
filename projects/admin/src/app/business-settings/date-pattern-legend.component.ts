import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Labels } from '@bikerental/shared';
import type { DatePatternSymbol } from '@bikerental/shared';

@Component({
  selector: 'app-date-pattern-legend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details open class="text-sm rounded border border-slate-200 px-3 py-2">
      <summary class="cursor-pointer text-slate-500">{{ Labels.DatePatternLegendTitle }}</summary>
      <p class="text-xs text-slate-500 mt-2">{{ Labels.DatePatternLegendIntro }}</p>
      <p class="text-xs text-slate-500 mb-2">{{ Labels.DatePatternLegendExampleDate }}</p>
      <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-xs">
        @for (item of symbols(); track item.symbol) {
          <dt class="font-mono font-medium">{{ item.symbol }}</dt>
          <dd>{{ item.description }}</dd>
        }
      </dl>
      <p class="text-xs text-slate-500 mt-2">{{ Labels.DatePatternSymbolCaseNote }}</p>
    </details>
  `,
})
export class DatePatternLegendComponent {
  protected readonly Labels = Labels;
  readonly symbols = input.required<readonly DatePatternSymbol[]>();
}
