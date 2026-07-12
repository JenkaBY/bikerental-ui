import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterOutlet } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CustomerFinanceStore } from '../../../../core/state/customer-finance.store';
import { CustomerRatingService } from '../../../../core/state/customer-rating.service';
import { CustomerStore } from '../../../../core/state/customer.store';
import { CustomerLayoutStore } from '../../../../core/state/customer-layout.store';
import { CustomerRentalsStore } from '../../../../core/state/customer-rentals.store';
import { CustomerTransactionsStore } from '../../../../core/state/customer-transactions.store';
import { Labels } from '../../../constant/labels';
import { MoneyPipe } from '../../../pipes/money.pipe';
import { UserAvatarComponent } from '../../user-avatar/user-avatar.component';
import { CustomerRatingBadgeComponent } from '../customer-rating-badge/customer-rating-badge.component';
import { PageHeaderComponent } from '../../page-header/page-header.component';
import { SegmentedTabsComponent, SegmentTab } from '../../segmented-tabs/segmented-tabs.component';
import { filter, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-customer-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    CustomerStore,
    CustomerLayoutStore,
    CustomerFinanceStore,
    CustomerRentalsStore,
    CustomerTransactionsStore,
  ],
  imports: [
    RouterOutlet,
    MatProgressBarModule,
    MoneyPipe,
    UserAvatarComponent,
    CustomerRatingBadgeComponent,
    PageHeaderComponent,
    SegmentedTabsComponent,
  ],
  template: `
    <div class="flex flex-col h-full -mx-4 -mt-4">
      <app-page-header [backLabel]="Labels.CustomerBackButton" (back)="goBack()">
        @if (!layoutStore.customer()) {
          <mat-progress-bar mode="indeterminate" class="flex-1" />
        } @else {
          <div class="flex items-center gap-2 flex-1 min-w-0">
            <app-user-avatar
              class="shrink-0"
              [displayName]="customerFullName()"
              sizeClass="h-10 w-10 text-sm"
            />
            <div class="flex flex-col flex-1 min-w-0">
              <span class="flex items-center gap-2 min-w-0">
                <span class="font-semibold text-slate-800 truncate">
                  {{ layoutStore.customer()?.firstName }}
                  {{ layoutStore.customer()?.lastName }}
                </span>
                <app-customer-rating-badge [rating]="rating()" />
              </span>
              <span class="text-sm text-slate-500 truncate">
                {{ layoutStore.customer()?.phone }}
              </span>
            </div>
          </div>
        }

        @if (layoutStore.balance(); as balance) {
          <div actions class="flex flex-col items-end gap-1 text-xs shrink-0">
            <span
              class="px-2 py-0.5 rounded-full bg-green-100 text-green-800 whitespace-nowrap"
              [title]="Labels.Available"
            >
              {{ balance.available | money }}
            </span>
            <span
              class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap"
              [title]="Labels.CustomerBalanceReserved"
            >
              {{ balance.reserved | money }}
            </span>
          </div>
        }
      </app-page-header>

      <app-segmented-tabs [tabs]="tabs" linkMode />

      <div class="flex-1 overflow-auto">
        <router-outlet />
      </div>
    </div>
  `,
})
export class CustomerDetailComponent {
  protected readonly Labels = Labels;

  protected readonly tabs: SegmentTab[] = [
    { id: 'profile', label: Labels.CustomerProfileTabLabel },
    { id: 'rentals', label: Labels.CustomerRentalsTabLabel },
    { id: 'account', label: Labels.CustomerAccountTabLabel },
    { id: 'transactions', label: Labels.CustomerTransactionsTabLabel },
  ];

  protected readonly layoutStore = inject(CustomerLayoutStore);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly ratingService = inject(CustomerRatingService);

  protected readonly customerFullName = computed(() => {
    const c = this.layoutStore.customer();
    return c ? `${c.firstName} ${c.lastName}`.trim() : '';
  });

  protected readonly rating = computed(() => {
    const id = this.layoutStore.customer()?.id;
    return id ? this.ratingService.getRating(id) : null;
  });

  protected goBack(): void {
    this.location.back();
  }

  constructor() {
    this.route.params
      .pipe(
        map((params) => params['id']),
        filter((id) => !!id),
        takeUntilDestroyed(),
      )
      .subscribe((id) => this.layoutStore.init(id));
  }
}
