import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { Labels } from '@bikerental/shared';
import { InlineNumberInputComponent } from './inline-number-input.component';

@Component({
  selector: 'app-fixed-price-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [InlineNumberInputComponent],
  template: `
    <app-inline-number-input
      [value]="value()"
      [suffix]="currency()"
      [decimals]="2"
      [min]="0"
      widthClass="w-24"
      [emptyValue]="null"
      [ariaLabel]="Labels.SpecialPrice"
      (valueChange)="valueChange.emit($event)"
    />
  `,
})
export class FixedPriceInputComponent {
  readonly value = input<number | null>(null);
  readonly currency = input('');
  readonly valueChange = output<number | null>();

  protected readonly Labels = Labels;
}
