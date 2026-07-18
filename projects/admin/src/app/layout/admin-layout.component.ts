import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  APP_BRAND,
  AuthService,
  HealthIndicatorComponent,
  Labels,
  NavItem,
  ProfileMenuComponent,
  ShellComponent,
} from '@bikerental/shared';

const NAV_ITEMS: NavItem[] = [
  { label: $localize`Equipment`, route: 'equipment', icon: 'pedal_bike' },
  { label: $localize`Equipment Types`, route: 'equipment-types', icon: 'category' },
  { label: $localize`Tariffs`, route: 'tariffs', icon: 'payments' },
  { label: Labels.AgreementsNavLabel, route: 'agreements', icon: 'history_edu' },
  { label: $localize`Customers`, route: 'customers', icon: 'people' },
  { label: $localize`Rentals`, route: 'rentals', icon: 'receipt_long' },
  { label: $localize`Payments`, route: 'payments', icon: 'account_balance_wallet' },
  { label: $localize`Users`, route: 'users', icon: 'manage_accounts' },
];

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShellComponent, RouterOutlet, HealthIndicatorComponent, ProfileMenuComponent],
  host: { class: 'block h-screen' },
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  protected navItems = NAV_ITEMS;
  protected brand = inject(APP_BRAND);
  protected title = $localize`Admin Dashboard`;
  protected sidenavOpened = signal(true);
  private readonly auth = inject(AuthService);

  protected onToggleSidebar() {
    this.sidenavOpened.update((v) => !v);
  }

  protected onLogout() {
    this.auth.logout();
  }
}
