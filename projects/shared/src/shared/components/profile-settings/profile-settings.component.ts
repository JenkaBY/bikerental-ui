import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatTabsModule, MatIconModule],
  host: { class: 'block h-full' },
  template: `
    <div class="flex flex-col h-full">
      <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="bg-white border-b border-slate-200">
        <a
          mat-tab-link
          routerLink="account"
          routerLinkActive
          #rla0="routerLinkActive"
          [active]="rla0.isActive"
          [attr.aria-label]="labels.ProfileAccountTab"
          [title]="labels.ProfileAccountTab"
        >
          <mat-icon>account_circle</mat-icon>
        </a>
        <a
          mat-tab-link
          routerLink="security"
          routerLinkActive
          #rla1="routerLinkActive"
          [active]="rla1.isActive"
          [attr.aria-label]="labels.ProfileSecurityTab"
          [title]="labels.ProfileSecurityTab"
        >
          <mat-icon>gpp_good</mat-icon>
        </a>
        <a
          mat-tab-link
          routerLink="preferences"
          routerLinkActive
          #rla2="routerLinkActive"
          [active]="rla2.isActive"
          [attr.aria-label]="labels.ProfilePreferencesTab"
          [title]="labels.ProfilePreferencesTab"
        >
          <mat-icon>settings</mat-icon>
        </a>
        <a
          mat-tab-link
          routerLink="connected"
          routerLinkActive
          #rla3="routerLinkActive"
          [active]="rla3.isActive"
          [attr.aria-label]="labels.ProfileConnectedTab"
          [title]="labels.ProfileConnectedTab"
        >
          <mat-icon>hub</mat-icon>
        </a>
      </nav>

      <mat-tab-nav-panel #tabPanel class="flex-1 overflow-auto">
        <router-outlet />
      </mat-tab-nav-panel>
    </div>
  `,
})
export class ProfileSettingsComponent {
  protected readonly labels = Labels;
}
