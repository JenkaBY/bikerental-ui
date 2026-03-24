import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Labels } from '../../../shared/constant/labels';

@Component({
  selector: 'app-special-params',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `<p class="col-span-2 text-sm text-slate-500">{{ labels.NoAdditionalParams }}</p>`,
})
export class SpecialParamsComponent {
  readonly labels = Labels;
}
