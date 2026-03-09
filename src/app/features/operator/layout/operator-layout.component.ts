import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppToolbarComponent } from '../../../shared/components/app-toolbar/app-toolbar.component';
import { BottomNavComponent } from '../../../shared/components/bottom-nav/bottom-nav.component';
import { HealthIndicatorComponent } from '../../../shared/components/health-indicator/health-indicator.component';
import { LogoutButtonComponent } from '../../../shared/components/logout-button/logout-button.component';
import { NavItem } from '../../../shared/components/sidebar-nav-item/nav-item.model';
import { APP_BRAND } from '../../../app.tokens';

const NAV_ITEMS: NavItem[] = [
  { label: $localize`Dashboard`, route: 'dashboard', icon: 'dashboard' },
  { label: $localize`New Rental`, route: 'rental/new', icon: 'add_circle' },
  { label: $localize`Return`, route: 'return', icon: 'qr_code_scanner' },
];

@Component({
  selector: 'app-operator-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    AppToolbarComponent,
    BottomNavComponent,
    HealthIndicatorComponent,
    LogoutButtonComponent,
  ],
  host: { class: 'flex flex-col h-screen max-w-[480px] mx-auto' },
  template: `
    <app-toolbar [title]="title" [showToggle]="false">
      <app-health-indicator />
      <app-logout-button (logout)="onLogout()" />
    </app-toolbar>

    <main class="flex-1 overflow-y-auto p-4 [-webkit-overflow-scrolling:touch]">
      <router-outlet />
    </main>

    <app-bottom-nav [items]="navItems" />
  `,
})
export class OperatorLayoutComponent {
  protected navItems = NAV_ITEMS;
  protected brand = inject(APP_BRAND);
  protected title = $localize`Bike Rental`;

  protected onLogout() {
    console.log('logout requested from operator layout');
  }
}
