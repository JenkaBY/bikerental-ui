import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CustomerRef } from '../../../../core/models/customer.model';
@Component({
  selector: 'app-customer-ref',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (customer(); as c) {
      @if (link()) {
        <a
          [routerLink]="['/customers', c.id]"
          class="text-emerald-700 font-medium no-underline hover:underline whitespace-nowrap"
        >
          <span>{{ c.phone }}</span>
          @if (c.name) {
            <span class="font-normal text-slate-500">&nbsp;({{ c.name }})</span>
          }
        </a>
      } @else {
        <span class="text-slate-700 whitespace-nowrap">
          <span>{{ c.phone }}</span>
          @if (c.name) {
            <span class="text-slate-500">&nbsp;({{ c.name }})</span>
          }
        </span>
      }
    } @else {
      <span class="text-slate-400">—</span>
    }
  `,
})
export class CustomerRefComponent {
  readonly customer = input<CustomerRef | undefined>();
  readonly link = input(false);
}
