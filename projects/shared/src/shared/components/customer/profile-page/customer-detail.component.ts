import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MoneyPipe,
    UserAvatarComponent,
    CustomerRatingBadgeComponent,
  ],
  template: `
    <div class="flex flex-col h-full">
      <!-- Toolbar -->
      <div class="flex flex-wrap items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button mat-icon-button (click)="goBack()" [attr.aria-label]="Labels.CustomerBackButton">
          <mat-icon>arrow_back</mat-icon>
        </button>

        @if (!this.layoutStore.customer()) {
          <mat-progress-bar mode="indeterminate" class="flex-1" />
        } @else {
          <app-user-avatar
            class="shrink-0"
            [displayName]="customerFullName()"
            sizeClass="h-10 w-10 text-sm"
          />

          <div class="flex flex-col flex-1 min-w-0">
            <span class="flex items-center gap-2 min-w-0">
              <span class="font-semibold text-slate-800 truncate">
                {{ this.layoutStore.customer()?.firstName }}
                {{ this.layoutStore.customer()?.lastName }}
              </span>
              <app-customer-rating-badge [rating]="rating()" />
            </span>
            <span class="text-sm text-slate-500">{{ this.layoutStore.customer()?.phone }}</span>
          </div>
        }

        <!-- Balance badges -->
        @if (this.layoutStore.balance()) {
          <div class="flex flex-wrap gap-2 text-xs shrink-0">
            <span class="px-2 py-1 rounded-full bg-green-100 text-green-800">
              {{ Labels.Available }}:
              {{ this.layoutStore.balance()!.available | money }}
            </span>
            <span class="px-2 py-1 rounded-full bg-amber-100 text-amber-800">
              {{ Labels.CustomerBalanceReserved }}:
              {{ this.layoutStore.balance()!.reserved | money }}
            </span>
          </div>
        }
      </div>

      <!-- Tab nav bar -->
      <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="bg-white border-b border-slate-200">
        <a
          mat-tab-link
          routerLink="profile"
          routerLinkActive
          #rla0="routerLinkActive"
          [active]="rla0.isActive"
        >
          {{ Labels.CustomerProfileTabLabel }}
        </a>
        <a
          mat-tab-link
          routerLink="rentals"
          routerLinkActive
          #rla1="routerLinkActive"
          [active]="rla1.isActive"
        >
          {{ Labels.CustomerRentalsTabLabel }}
        </a>
        <a
          mat-tab-link
          routerLink="account"
          routerLinkActive
          #rla2="routerLinkActive"
          [active]="rla2.isActive"
        >
          {{ Labels.CustomerAccountTabLabel }}
        </a>
        <a
          mat-tab-link
          routerLink="transactions"
          routerLinkActive
          #rla3="routerLinkActive"
          [active]="rla3.isActive"
        >
          {{ Labels.CustomerTransactionsTabLabel }}
        </a>
      </nav>

      <mat-tab-nav-panel #tabPanel class="flex-1 overflow-auto">
        <router-outlet />
      </mat-tab-nav-panel>
    </div>
  `,
})
export class CustomerDetailComponent {
  protected readonly Labels = Labels;

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
