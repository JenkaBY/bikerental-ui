import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CustomerStore, Labels, MoneyPipe } from '@bikerental/shared';
import { CustomerLayoutStore } from './customer-layout.store';
import { CustomerRentalsStore } from './customer-rentals.store';
import { CustomerTransactionsStore } from './customer-transactions.store';
import { CustomerFinanceStore } from '@store.customer-finance.store';
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
  ],
  template: `
    <div class="flex flex-col h-full">
      <!-- Toolbar -->
      <div class="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          mat-icon-button
          [routerLink]="['/customers']"
          [attr.aria-label]="Labels.CustomerBackButton"
        >
          <mat-icon>arrow_back</mat-icon>
        </button>

        @if (!this.layoutStore.customer()) {
          <mat-progress-bar mode="indeterminate" class="flex-1" />
        } @else {
          <div class="flex flex-col flex-1 min-w-0">
            <span class="font-semibold text-slate-800 truncate">
              {{ this.layoutStore.customer()?.firstName }}
              {{ this.layoutStore.customer()?.lastName }}
            </span>
            <span class="text-sm text-slate-500">{{ this.layoutStore.customer()?.phone }}</span>
          </div>
        }

        <!-- Balance badges -->
        @if (this.layoutStore.balance()) {
          <div class="flex gap-2 text-xs shrink-0">
            <span class="px-2 py-1 rounded-full bg-green-100 text-green-800">
              {{ Labels.CustomerBalanceAvailable }}:
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
