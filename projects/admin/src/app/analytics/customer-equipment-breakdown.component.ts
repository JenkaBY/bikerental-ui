import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  CustomerEquipmentBreakdownStore,
  EQUIPMENT_REVENUE_METRIC_KEYS,
  Labels,
  resolveErrorMessage,
  type CustomerAnalyticsRange,
} from '@bikerental/shared';
import { CustomerEquipmentTableComponent } from './customer-equipment-table.component';
import { RevenueTotalsComponent } from './revenue-totals.component';

@Component({
  selector: 'app-customer-equipment-breakdown',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerEquipmentBreakdownStore],
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    RevenueTotalsComponent,
    CustomerEquipmentTableComponent,
  ],
  template: `
    <div class="mt-4 flex items-center gap-2 mb-3">
      <button
        mat-icon-button
        [attr.aria-label]="Labels.AnalyticsBackToCustomers"
        [matTooltip]="Labels.AnalyticsBackToCustomers"
        (click)="back.emit()"
      >
        <mat-icon>arrow_back</mat-icon>
      </button>
      @if (store.customer(); as c) {
        <a
          [routerLink]="['/customers', customerId()]"
          class="text-emerald-700 font-medium no-underline"
          >{{ c.phone }}</a
        >
        @if (c.name) {
          <span class="text-slate-800">({{ c.name }})</span>
        }
      } @else {
        <span class="text-base font-medium text-slate-800">{{
          Labels.AnalyticsUnknownCustomer
        }}</span>
      }
    </div>

    @if (store.error(); as err) {
      <div class="text-center mt-6 flex flex-col items-center gap-2">
        <p class="text-slate-500">{{ resolveErrorMessage(err) }}</p>
        <button mat-stroked-button (click)="store.reload()">{{ Labels.Retry }}</button>
      </div>
    } @else if (store.loading()) {
      <mat-progress-bar mode="indeterminate" class="mt-3" />
    } @else if (store.isEmpty()) {
      <p class="text-sm text-slate-400 py-8 text-center">
        {{ Labels.AnalyticsCustomerBreakdownEmptyState }}
      </p>
    } @else {
      <div class="flex flex-col gap-4">
        <app-revenue-totals [totals]="store.totals()" [metricKeys]="metricKeys" />
        <app-customer-equipment-table
          [types]="store.types()"
          [metricKeys]="metricKeys"
          [typeNameFor]="typeNameForFn"
          [unitNameFor]="unitNameForFn"
        />
        <p class="text-xs text-slate-400">{{ Labels.AnalyticsCustomerBreakdownNote }}</p>
      </div>
    }
  `,
})
export class CustomerEquipmentBreakdownComponent {
  protected readonly store = inject(CustomerEquipmentBreakdownStore);

  readonly range = input.required<CustomerAnalyticsRange>();
  readonly customerId = input.required<string>();
  readonly back = output<void>();

  protected readonly Labels = Labels;
  protected readonly metricKeys = EQUIPMENT_REVENUE_METRIC_KEYS;
  protected readonly resolveErrorMessage = resolveErrorMessage;

  protected readonly typeNameForFn = (slug: string): string => this.store.typeNameFor(slug);
  protected readonly unitNameForFn = (id: string): string => this.store.unitNameFor(id);

  constructor() {
    effect(() => {
      this.store.setRange(this.range());
      this.store.setCustomerId(this.customerId());
    });
  }

  reload(): void {
    this.store.reload();
  }
}
