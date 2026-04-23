import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  APP_BRAND,
  HealthIndicatorComponent,
  LayoutModeService,
  LogoutButtonComponent,
  NavItem,
  ShellComponent,
} from '@bikerental/shared';
import { OperatorLayoutComponent } from './operator-layout.component';

const NAV_ITEMS: NavItem[] = [
  { label: $localize`Dashboard`, route: 'dashboard', icon: 'dashboard' },
  { label: $localize`New Rental`, route: 'rental/new', icon: 'add_circle' },
  { label: $localize`Return`, route: 'return', icon: 'qr_code_scanner' },
];

@Component({
  selector: 'app-operator-shell-wrapper',
  standalone: true,
  imports: [
    RouterOutlet,
    OperatorLayoutComponent,
    ShellComponent,
    HealthIndicatorComponent,
    LogoutButtonComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (layout.isMobile()) {
      <app-operator-layout>
        <router-outlet></router-outlet>
      </app-operator-layout>
    } @else {
      <app-shell [items]="navItems" [brand]="brand" [title]="title" [showModeToggle]="true">
        <div sidebar-footer>
          <app-health-indicator />
        </div>

        <div toolbar-actions>
          <app-logout-button (logout)="onLogout()" />
        </div>

        <router-outlet></router-outlet>
      </app-shell>
    }
  `,
})
export class OperatorShellWrapperComponent {
  protected readonly layout = inject(LayoutModeService);
  protected readonly navItems = NAV_ITEMS;
  protected readonly brand = inject(APP_BRAND);
  protected readonly title = $localize`Operator`;

  protected onLogout() {
    console.log('logout from operator wrapper');
  }
}
