import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  APP_BRAND,
  HealthIndicatorComponent,
  LogoutButtonComponent,
  NavItem,
  ShellComponent,
} from '@bikerental/shared';

const NAV_ITEMS: NavItem[] = [
  { label: $localize`Equipment`, route: 'equipment', icon: 'pedal_bike' },
  { label: $localize`Equipment Types`, route: 'equipment-types', icon: 'category' },
  { label: $localize`Equipment Statuses`, route: 'equipment-statuses', icon: 'toggle_on' },
  { label: $localize`Tariffs`, route: 'tariffs', icon: 'payments' },
  { label: $localize`Customers`, route: 'customers', icon: 'people' },
  { label: $localize`Rentals`, route: 'rentals', icon: 'receipt_long' },
  { label: $localize`Payments`, route: 'payments', icon: 'account_balance_wallet' },
  { label: $localize`Users`, route: 'users', icon: 'manage_accounts' },
];

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShellComponent, RouterOutlet, HealthIndicatorComponent, LogoutButtonComponent],
  host: { class: 'block h-screen' },
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  protected navItems = NAV_ITEMS;
  protected brand = inject(APP_BRAND);
  protected title = $localize`Admin Dashboard`;
  protected sidenavOpened = signal(true);

  protected onToggleSidebar() {
    this.sidenavOpened.update((v) => !v);
  }

  protected onLogout() {
    console.log('logout requested from admin layout');
  }
}
