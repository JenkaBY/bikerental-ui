import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  APP_BRAND,
  AppToolbarComponent,
  BottomNavComponent,
  HealthIndicatorComponent,
  LogoutButtonComponent,
  NavItem,
} from '@bikerental/shared';

const NAV_ITEMS: NavItem[] = [
  { label: $localize`Dashboard`, route: 'dashboard', icon: 'dashboard' },
  { label: $localize`New Rental`, route: 'rental/new', icon: 'add_circle' },
  { label: $localize`Return`, route: 'return', icon: 'qr_code_scanner' },
];

@Component({
  selector: 'app-operator-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AppToolbarComponent,
    BottomNavComponent,
    HealthIndicatorComponent,
    LogoutButtonComponent,
  ],
  host: { class: 'flex flex-col h-screen max-w-[480px] mx-auto' },
  template: `
    <app-toolbar [title]="title" [showToggle]="false" [showDesktopModeToggle]="true">
      <app-health-indicator />
      <app-logout-button (logout)="onLogout()" />
    </app-toolbar>

    <main class="flex-1 overflow-y-auto p-4 [-webkit-overflow-scrolling:touch]">
      <ng-content></ng-content>
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
