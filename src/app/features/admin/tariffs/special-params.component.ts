import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Labels } from '../../../shared/constant/labels';

@Component({
  selector: 'app-special-params',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    @if (description()) {
      <div class="col-span-2 text-sm text-slate-500">{{ description() }}</div>
    }
    <p class="col-span-2 text-sm text-slate-500">{{ labels.NoAdditionalParams }}</p>
  `,
})
export class SpecialParamsComponent {
  readonly labels = Labels;
  readonly description = input<string | undefined>('');
}
