import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ShellComponent } from '../../../shared/components/shell/shell.component';
import { HealthIndicatorComponent } from '../../../shared/components/health-indicator/health-indicator.component';
import { LogoutButtonComponent } from '../../../shared/components/logout-button/logout-button.component';
import { NavItem } from '../../../shared/components/sidebar-nav-item/nav-item.model';
import { APP_BRAND } from '../../../app.tokens';

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
  protected sidenavOpened = signal(true);

  protected onToggleSidebar() {
    this.sidenavOpened.update((v) => !v);
  }

  protected onLogout() {
    // AuthService will be wired in TASK002 — emit/trigger logout here when available
    console.log('logout requested');
  }
}
