import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterOutlet } from '@angular/router';
import {
  APP_BRAND,
  AppToolbarComponent,
  AuthService,
  BottomNavComponent,
  CurrentPointStore,
  HealthIndicatorComponent,
  Labels,
  NavItem,
  OperatingScopeStore,
  ProfileMenuComponent,
} from '@bikerental/shared';

const NAV_ITEMS: NavItem[] = [
  { label: $localize`Rentals`, route: 'rentals', icon: 'directions_bike' },
  { label: $localize`New Rental`, route: 'rentals/new', icon: 'add_circle' },
  { label: $localize`Return`, route: 'return', icon: 'qr_code_scanner' },
];

@Component({
  selector: 'app-operator-layout',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    MatIconModule,
    AppToolbarComponent,
    BottomNavComponent,
    HealthIndicatorComponent,
    ProfileMenuComponent,
  ],
  host: { class: 'flex flex-col h-screen max-w-[480px] mx-auto' },
  template: `
    <app-toolbar [title]="title" [showToggle]="false">
      @if (scopeStore.notEstablished()) {
        <span toolbarCenter class="flex items-center gap-1 text-sm font-medium" role="status">
          <mat-icon class="!text-base !w-4 !h-4">location_off</mat-icon>
          {{ labels.NoWorkingPoint }}
        </span>
      } @else if (pointStore.current(); as point) {
        <span
          toolbarCenter
          class="text-sm font-medium underline underline-offset-4 truncate max-w-[10rem]"
          [attr.aria-label]="labels.CurrentPoint"
        >
          {{ point.name }}
        </span>
      }
      <app-health-indicator />
      <app-profile-menu (logout)="onLogout()" />
    </app-toolbar>

    <main class="flex-1 overflow-y-auto p-4 [-webkit-overflow-scrolling:touch]">
      <router-outlet></router-outlet>
    </main>

    <app-bottom-nav [items]="navItems" />
  `,
})
export class OperatorLayoutComponent {
  protected navItems = NAV_ITEMS;
  protected brand = inject(APP_BRAND);
  protected title = this.brand;
  protected readonly labels = Labels;
  protected readonly pointStore = inject(CurrentPointStore);
  protected readonly scopeStore = inject(OperatingScopeStore);
  private readonly auth = inject(AuthService);

  protected onLogout() {
    this.auth.logout();
  }
}
