import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Labels } from '../../constant/labels';
import { SegmentedTabsComponent, SegmentTab } from '../segmented-tabs/segmented-tabs.component';

@Component({
  selector: 'app-profile-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SegmentedTabsComponent],
  host: { class: 'block h-full' },
  template: `
    <div class="flex flex-col h-full">
      <app-segmented-tabs [tabs]="tabs" linkMode iconOnly />

      <div class="flex-1 overflow-auto">
        <router-outlet />
      </div>
    </div>
  `,
})
export class ProfileSettingsComponent {
  protected readonly tabs: SegmentTab[] = [
    { id: 'account', label: Labels.ProfileAccountTab, icon: 'account_circle' },
    { id: 'security', label: Labels.ProfileSecurityTab, icon: 'gpp_good' },
    { id: 'preferences', label: Labels.ProfilePreferencesTab, icon: 'settings' },
    { id: 'connected', label: Labels.ProfileConnectedTab, icon: 'hub' },
  ];
}
