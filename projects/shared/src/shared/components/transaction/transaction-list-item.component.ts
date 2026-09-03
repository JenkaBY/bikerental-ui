import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import type { CustomerRef } from '../../../core/models/customer.model';
import type { CustomerTransaction } from '../../../core/models/transaction.model';
import { makeMoney } from '../../../core/mappers/money.mapper';
import { Labels } from '../../constant/labels';
import { LocalTimestampPipe } from '../../pipes/local-timestamp.pipe';
import { MoneyPipe } from '../../pipes/money.pipe';
import {
  mapPaymentMethodLabel,
  mapTransactionFlow,
  mapTransactionKind,
} from '../../transaction.meta';
import { DeployedPath } from '../../utils/deployed-path';

@Component({
  selector: 'app-transaction-list-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LocalTimestampPipe, MatButtonModule, MatIconModule, MoneyPipe, RouterLink],
  template: `
    @if (transaction(); as t) {
      <div class="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
        <mat-icon class="shrink-0 text-slate-400" aria-hidden="true">{{ meta().icon }}</mat-icon>
        <span class="flex flex-col min-w-0 flex-1">
          <span class="text-sm text-slate-700 truncate">{{ meta().label }}</span>
          <span class="text-xs text-slate-400 flex items-center gap-1 flex-wrap">
            @if (customer(); as c) {
              <a [href]="customerUrl()" class="text-emerald-700 font-medium no-underline">{{
                c.phone
              }}</a>
              @if (c.name) {
                <span>({{ c.name }})</span>
              }
              <span>·</span>
            }
            @if (flow(); as f) {
              <span>{{ f.from }} → {{ f.to }} ·</span>
            }
            <span>{{ t.recordedAt | localTimestamp }}</span>
            @if (paymentMethodLabel(); as pm) {
              <span>· {{ pm }}</span>
            }
            @if (rentalLink(); as link) {
              <span>·</span>
              <a
                [routerLink]="link"
                class="text-emerald-700 font-medium inline-flex items-center gap-0.5 no-underline"
              >
                {{ Labels.RentalPrefix }}{{ t.sourceId }}
                <mat-icon style="font-size:12px;width:12px;height:12px" aria-hidden="true"
                  >open_in_new</mat-icon
                >
              </a>
            }
          </span>
          @if (showBalances() && t.balances) {
            <span class="text-xs text-slate-400">
              {{ Labels.Available }} {{ availableBalance() | money }} ·
              {{ Labels.CustomerBalanceReserved }} {{ reservedBalance() | money }}
            </span>
          }
        </span>
        <span
          class="text-sm font-semibold whitespace-nowrap"
          [class.text-emerald-600]="t.amountColor === 'positive'"
          [class.text-slate-700]="t.amountColor === 'negative'"
          [class.text-slate-400]="t.amountColor === 'neutral'"
        >
          {{ t.amount | money: true }}
        </span>
        @if (detailsLink(); as link) {
          <a
            mat-icon-button
            [routerLink]="link"
            class="shrink-0"
            [attr.aria-label]="Labels.TransactionViewDetails"
          >
            <mat-icon>chevron_right</mat-icon>
          </a>
        }
      </div>
    }
  `,
})
export class TransactionListItemComponent {
  private readonly document = inject(DOCUMENT);

  readonly transaction = input.required<CustomerTransaction>();
  readonly showBalances = input<boolean>(false);
  readonly showRentalLink = input<boolean>(false);
  readonly customer = input<CustomerRef | undefined>();
  readonly detailsLink = input<string | string[] | null>(null);

  protected readonly Labels = Labels;

  protected readonly meta = computed(() => mapTransactionKind(this.transaction().kind));

  protected readonly flow = computed(() => mapTransactionFlow(this.transaction()));

  protected readonly availableBalance = computed(
    () => this.transaction().balances?.wallet ?? makeMoney(0),
  );

  protected readonly reservedBalance = computed(
    () => this.transaction().balances?.hold ?? makeMoney(0),
  );

  protected readonly paymentMethodLabel = computed(() => {
    const method = this.transaction().paymentMethod;
    return method && method !== 'INTERNAL_TRANSFER' ? mapPaymentMethodLabel(method) : '';
  });

  protected readonly rentalLink = computed(() => {
    const t = this.transaction();
    if (!this.showRentalLink() || t.sourceType !== 'RENTAL' || !t.sourceId) return null;
    return ['/rentals', t.sourceId];
  });

  protected readonly customerUrl = computed(() => {
    const c = this.customer();
    return c
      ? DeployedPath.fromBase(this.document.baseURI).withRoute(`customers/${c.id}`).toString()
      : '';
  });
}
