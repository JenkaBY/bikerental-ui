import { DOCUMENT, Location } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { DamageReportDetailStore } from '../../../core/state/damage-report-detail.store';
import { Labels } from '../../constant/labels';
import { LocalTimestampPipe } from '../../pipes/local-timestamp.pipe';
import { MoneyPipe } from '../../pipes/money.pipe';
import { DeployedPath } from '../../utils/deployed-path';
import { PageHeaderComponent } from '../page-header/page-header.component';
import { PenaltyStatusBadgeComponent } from '../penalty-status-badge/penalty-status-badge.component';

@Component({
  selector: 'app-damage-report-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DamageReportDetailStore],
  imports: [
    LocalTimestampPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MoneyPipe,
    RouterLink,
    PageHeaderComponent,
    PenaltyStatusBadgeComponent,
  ],
  template: `
    <div class="flex flex-col h-full -m-4">
      <app-page-header [title]="Labels.DamageReportDetailTitle" (back)="location.back()" />

      @if (store.loading()) {
        <div class="flex justify-center py-8">
          <mat-spinner diameter="40" />
        </div>
      } @else if (store.error()) {
        <div class="flex flex-col items-center gap-4 py-8 px-4">
          <p class="text-slate-500 text-sm">{{ Labels.DamageReportLoadError }}</p>
          <button mat-button (click)="store.reload()">{{ Labels.Retry }}</button>
        </div>
      } @else if (store.report(); as r) {
        <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-slate-900"
              >{{ Labels.DamageReportPrefix }}{{ r.id }}</span
            >
            <span class="text-sm text-slate-500">{{ r.reportedAt | localTimestamp }}</span>
          </div>

          <div class="flex gap-2">
            @if (rentalLink(); as link) {
              <a
                mat-stroked-button
                [routerLink]="link"
                class="flex-1 min-w-0"
                [attr.aria-label]="Labels.DamageReportRentalLink"
                [title]="Labels.DamageReportRentalLink"
              >
                <mat-icon>receipt_long</mat-icon>
                {{ Labels.RentalPrefix }}{{ r.rentalId }}
              </a>
            }
            @if (customerUrl(); as url) {
              <a
                mat-stroked-button
                [href]="url"
                class="flex-1 min-w-0"
                [attr.aria-label]="Labels.DamageReportCustomerLink"
                [title]="Labels.DamageReportCustomerLink"
              >
                <mat-icon>person</mat-icon>
                {{ Labels.CustomerName }}
              </a>
            }
          </div>

          <div class="rounded-lg bg-slate-50 px-3 py-2">
            <p class="text-xs text-slate-500">{{ Labels.Description }}</p>
            <p class="text-sm text-slate-800 whitespace-pre-wrap">{{ r.description }}</p>
          </div>

          <div>
            <p class="text-xs font-medium text-slate-500 mb-1">
              {{ Labels.DamageReportItemsTitle }}
            </p>
            <div class="flex flex-col gap-1">
              @for (item of r.items; track item.equipmentId) {
                <div
                  class="flex items-center justify-between gap-2 bg-slate-50 rounded-lg px-3 py-2"
                >
                  <span class="flex flex-col min-w-0">
                    <span class="text-sm text-slate-800 truncate">
                      {{ item.equipmentUid }}
                      @if (item.equipmentModel; as model) {
                        <span class="text-slate-500">{{ model }}</span>
                      }
                    </span>
                  </span>
                  <span class="text-xs text-slate-500 shrink-0 whitespace-nowrap">
                    {{ item.previousCondition?.name ?? '—' }} → {{ item.condition?.name ?? '—' }}
                  </span>
                </div>
              }
            </div>
          </div>

          <div class="rounded-lg border border-slate-200 px-3 py-3">
            <p class="text-xs font-medium text-slate-500 mb-2">{{ Labels.PenaltyAmountLabel }}</p>
            @if (r.penalty; as penalty) {
              <div class="flex items-center justify-between">
                <span class="text-lg font-bold text-slate-900">{{ penalty.amount | money }}</span>
                <app-penalty-status-badge [status]="penalty.status" />
              </div>
            } @else {
              <p class="text-sm text-slate-500">{{ Labels.DamageReportNoPenalty }}</p>
            }
          </div>

          <p class="text-xs text-slate-400">
            {{ Labels.DamageReportOperatorLabel }}: {{ r.operatorId }}
          </p>
        </div>
      } @else {
        <div class="flex flex-col items-center gap-4 py-8 px-4">
          <p class="text-slate-500 text-sm">{{ Labels.DamageReportNotFound }}</p>
        </div>
      }
    </div>
  `,
})
export class DamageReportDetailComponent {
  protected readonly store = inject(DamageReportDetailStore);
  protected readonly location = inject(Location);
  private readonly document = inject(DOCUMENT);

  readonly id = input.required<string>();

  protected readonly Labels = Labels;

  private readonly reportId = computed(() => Number(this.id()));

  protected readonly rentalLink = computed(() => {
    const rentalId = this.store.report()?.rentalId;
    return rentalId ? ['/rentals', rentalId] : null;
  });

  protected readonly customerUrl = computed(() => {
    const customerId = this.store.report()?.customerId;
    return customerId
      ? DeployedPath.fromBase(this.document.baseURI).withRoute(`customers/${customerId}`).toString()
      : null;
  });

  constructor() {
    effect(() => {
      const id = this.reportId();
      if (!isNaN(id) && id > 0) {
        this.store.load(id);
      }
    });
  }
}
