import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe, DOCUMENT } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import type {
  CustomerRentalSummary,
  RentalCustomerRef,
} from '../../../../../../core/models/rental.model';
import { mapRentalStatus } from '../../../../../rental-status.meta';
import { Labels } from '../../../../../constant/labels';
import { MoneyPipe } from '../../../../../pipes/money.pipe';
import { DeployedPath } from '../../../../../utils/deployed-path';
import { EquipmentBadgeComponent } from '../../../../equipment-badge/equipment-badge.component';

@Component({
  selector: 'app-customer-rental-list-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MoneyPipe, MatButtonModule, MatIconModule, EquipmentBadgeComponent],
  template: `
    @if (rental(); as r) {
      <div class="relative border border-slate-200 rounded-lg pl-4 pr-11 py-3 hover:bg-slate-50">
        @if (customer(); as c) {
          <a [href]="customerUrl()" class="text-sm font-semibold text-emerald-700 hover:underline">
            {{ c.phone }}
            @if (c.name) {
              <span class="font-normal text-slate-500">({{ c.name }})</span>
            }
          </a>
        }
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-semibold text-slate-900">
            #{{ r.id }}&nbsp;&middot;&nbsp;{{ r.createdAt | date: 'dd MMM, HH:mm' }}
          </span>
          <span
            [class]="badgeClasses()"
            class="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full"
          >
            {{ statusLabel() }}
          </span>
        </div>

        <div class="mt-2 flex items-end justify-between gap-3">
          <div class="flex flex-wrap gap-1 min-w-0">
            @for (e of r.equipment; track e.id) {
              <app-equipment-badge [uid]="e.uid" [name]="e.name" />
            }
          </div>

          <span class="shrink-0 text-sm whitespace-nowrap">
            @if (r.finalCost; as fc) {
              <span class="font-semibold text-slate-900">{{ fc | money }}</span>
            } @else if (r.estimatedCost; as ec) {
              <span aria-hidden="true">≈&nbsp;</span>
              <span class="sr-only">{{ Labels.CustomerRentalsCostEstimated }}</span>
              <span class="text-slate-500">{{ ec | money }}</span>
            } @else {
              <span aria-hidden="true" class="text-slate-400">—</span>
              <span class="sr-only">{{ Labels.CustomerRentalsCostNotBilled }}</span>
            }
          </span>
        </div>

        <a
          mat-icon-button
          [href]="detailUrl()"
          class="!absolute top-1.5 right-1.5"
          [attr.aria-label]="detailAriaLabel()"
        >
          <mat-icon>chevron_right</mat-icon>
        </a>
      </div>
    }
  `,
})
export class CustomerRentalListItemComponent {
  private readonly document = inject(DOCUMENT);

  readonly rental = input.required<CustomerRentalSummary>();
  readonly customer = input<RentalCustomerRef | undefined>();

  protected readonly Labels = Labels;

  protected readonly statusLabel = computed(() => mapRentalStatus(this.rental().status).label);
  protected readonly badgeClasses = computed(
    () => mapRentalStatus(this.rental().status).badgeClasses,
  );

  protected readonly detailUrl = computed(() =>
    DeployedPath.fromBase(this.document.baseURI)
      .withApp('operator')
      .withRoute(`rentals/${this.rental().id}`)
      .toString(),
  );

  protected readonly customerUrl = computed(() => {
    const c = this.customer();
    return c
      ? DeployedPath.fromBase(this.document.baseURI).withRoute(`customers/${c.id}`).toString()
      : '';
  });

  protected readonly detailAriaLabel = computed(
    () => `${Labels.CustomerRentalsViewDetails}: ${this.statusLabel()}`,
  );
}
