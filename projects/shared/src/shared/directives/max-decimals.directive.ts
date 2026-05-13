import { Directive, ElementRef, inject, input } from '@angular/core';
import { truncateDecimalPlaces } from '../utils/money.util';

@Directive({
  selector: 'input[appMaxDecimals]',
  host: {
    '(input)': 'onInput()',
  },
})
export class MaxDecimalsDirective {
  private readonly el = inject(ElementRef<HTMLInputElement>);

  readonly appMaxDecimals = input.required<number>();

  onInput(): void {
    const input = this.el.nativeElement;
    const truncated = truncateDecimalPlaces(input.value, this.appMaxDecimals());
    if (truncated !== null) {
      input.value = truncated;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
