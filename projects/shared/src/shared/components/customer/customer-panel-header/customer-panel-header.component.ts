import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { Customer, CustomerBalance } from '@ui-models';
import { UserAvatarComponent } from '../../user-avatar/user-avatar.component';
import { CustomerRatingBadgeComponent } from '../customer-rating-badge/customer-rating-badge.component';
import { CustomerBalancePillComponent } from '../customer-balance-pill/customer-balance-pill.component';

@Component({
  selector: 'app-customer-panel-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    UserAvatarComponent,
    CustomerRatingBadgeComponent,
    CustomerBalancePillComponent,
  ],
  template: `
    <button
      type="button"
      class="w-full text-left flex items-center gap-3 p-4"
      [attr.aria-expanded]="expanded()"
      (click)="toggled.emit()"
    >
      <app-user-avatar
        class="shrink-0"
        [displayName]="customerFullName()"
        sizeClass="h-11 w-11 text-base"
      />

      <span class="flex flex-col gap-0.5 min-w-0 flex-1">
        <span class="flex items-center gap-2 min-w-0">
          <span class="font-semibold text-slate-900 truncate">{{ customer()?.phone }}</span>
          <app-customer-rating-badge [rating]="rating()" />
        </span>
        @if (customerFullName()) {
          <span class="text-sm text-slate-500 truncate">{{ customerFullName() }}</span>
        }
      </span>

      <app-customer-balance-pill
        [available]="balance()?.available ?? null"
        [sufficient]="balanceSufficient()"
      />

      <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">{{
        expanded() ? 'expand_less' : 'expand_more'
      }}</mat-icon>
    </button>
  `,
})
export class CustomerPanelHeaderComponent {
  readonly customer = input<Customer | null>(null);
  readonly balance = input<CustomerBalance | null>(null);
  readonly rating = input<number | null>(null);
  readonly balanceSufficient = input<boolean>(true);
  readonly expanded = input<boolean>(false);

  readonly toggled = output<void>();

  protected readonly customerFullName = computed(() => {
    const c = this.customer();
    if (!c) return '';
    return `${c.firstName} ${c.lastName}`.trim();
  });
}
