import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-customer-count-tile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTooltipModule],
  template: `
    <div
      class="flex flex-col gap-1 rounded border border-slate-200 bg-white px-3 py-2 min-w-40"
      [matTooltip]="hint()"
    >
      <span class="text-xs text-slate-500">{{ label() }}</span>
      <span class="text-lg font-semibold text-slate-800">{{ value() ?? '—' }}</span>
    </div>
  `,
})
export class CustomerCountTileComponent {
  readonly label = input.required<string>();
  readonly hint = input<string>('');
  readonly value = input<number | undefined>(undefined);
}
