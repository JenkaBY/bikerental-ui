import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Customer } from '@bikerental/shared';

@Component({
  selector: 'app-customer-search-option',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="font-medium">{{ customer().phone }}</span>
    <span class="ml-2 text-slate-500">{{ customer().firstName }} {{ customer().lastName }}</span>
  `,
})
export class CustomerSearchOptionComponent {
  readonly customer = input.required<Customer>();
}
