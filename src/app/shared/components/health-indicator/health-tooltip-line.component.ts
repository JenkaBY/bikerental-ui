import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-health-tooltip-line',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (value() !== null && value() !== undefined) {
      <div class="flex gap-2 text-xs leading-snug">
        <span class="text-white/60">{{ label() }}</span>
        <span class="text-white font-medium">{{ value() }}</span>
      </div>
    }
  `,
})
export class HealthTooltipLineComponent {
  readonly label = input.required<string>();
  readonly value = input<string | null | undefined>();
}
