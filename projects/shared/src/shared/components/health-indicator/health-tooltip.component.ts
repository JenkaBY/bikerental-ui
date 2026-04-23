import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { HealthTooltipLineComponent } from './health-tooltip-line.component';

export interface TooltipLine {
  id: string;
  label: string;
  value: string | null;
  separator?: boolean;
}

@Component({
  selector: 'app-health-tooltip',
  standalone: true,
  imports: [HealthTooltipLineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex flex-col gap-1 p-2 rounded bg-gray-900 shadow-lg min-w-48 max-w-[min(20rem,calc(100vw-24px))] max-h-[min(16rem,calc(100vh-24px))] overflow-y-auto"
    >
      @for (line of lines(); track line.id) {
        @if (line.separator) {
          <div class="border-t border-white/20 mt-1 pt-1"></div>
        }
        <app-health-tooltip-line [label]="line.label" [value]="line.value" />
      }
    </div>
  `,
})
export class HealthTooltipComponent {
  readonly lines = input.required<TooltipLine[]>();
}
