import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Labels } from '@bikerental/shared';
import { InlineNumberInputComponent } from './inline-number-input.component';

@Component({
  selector: 'app-discount-percent-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InlineNumberInputComponent],
  template: `
    <app-inline-number-input
      [value]="value()"
      suffix="%"
      [decimals]="0"
      [min]="0"
      [max]="100"
      [emptyValue]="0"
      [ariaLabel]="Labels.DiscountPercent"
      (valueChange)="valueChange.emit($event ?? 0)"
    />
  `,
})
export class DiscountPercentInputComponent {
  readonly value = input<number | null>(null);
  readonly valueChange = output<number>();

  protected readonly Labels = Labels;
}
