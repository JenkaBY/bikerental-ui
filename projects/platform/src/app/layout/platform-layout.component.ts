import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  APP_BRAND,
  AuthService,
  HealthIndicatorComponent,
  Labels,
  LogoutButtonComponent,
  NavItem,
  ShellComponent,
} from '@bikerental/shared';

const NAV_ITEMS: NavItem[] = [
  { label: Labels.PlatformManagersNavLabel, route: 'managers', icon: 'admin_panel_settings' },
];

@Component({
  selector: 'app-platform-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ShellComponent, RouterOutlet, HealthIndicatorComponent, LogoutButtonComponent],
  host: { class: 'block h-screen' },
  template: `
    <app-shell [items]="navItems" [brand]="brand" [title]="title" (logout)="onLogout()">
      <div sidebar-footer>
        <app-health-indicator />
      </div>

      <div toolbar-actions>
        <app-logout-button (logout)="onLogout()" />
      </div>

      <router-outlet></router-outlet>
    </app-shell>
  `,
})
export class PlatformLayoutComponent {
  protected readonly navItems = NAV_ITEMS;
  protected readonly brand = inject(APP_BRAND);
  protected readonly title = Labels.PlatformDashboardTitle;
  private readonly auth = inject(AuthService);

  protected onLogout(): void {
    this.auth.logout();
  }
}
