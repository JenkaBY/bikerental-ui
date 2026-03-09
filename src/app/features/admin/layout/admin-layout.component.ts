import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';
import { HealthIndicatorComponent } from '../../../shared/components/health-indicator/health-indicator.component';
import { NavItem } from '../../../shared/components/sidebar-nav-item/nav-item.model';

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
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    RouterOutlet,
    SidebarComponent,
    HealthIndicatorComponent,
  ],
  host: { class: 'block h-screen' },
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  protected navItems = NAV_ITEMS;
  protected brand = `Bike Rental`;
  protected sidenavOpened = signal(true);

  protected onToggleSidebar() {
    this.sidenavOpened.update((v) => !v);
  }
}
