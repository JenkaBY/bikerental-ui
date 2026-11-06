import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import {
  BusinessSettingHistoryStore,
  BusinessSettingsStore,
  Labels,
  SegmentedTabsComponent,
} from '@bikerental/shared';
import type { SegmentTab } from '@bikerental/shared';

@Component({
  selector: 'app-business-settings-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [BusinessSettingsStore, BusinessSettingHistoryStore],
  imports: [MatCardModule, RouterOutlet, SegmentedTabsComponent],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.BusinessSettingsNavLabel }}</mat-card-title>
        <mat-card-subtitle>{{ Labels.BusinessSettingsSubtitle }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="mb-3">
          <app-segmented-tabs [tabs]="tabs" linkMode />
        </div>
        <router-outlet />
      </mat-card-content>
    </mat-card>
  `,
})
export class BusinessSettingsPageComponent {
  protected readonly Labels = Labels;
  protected readonly tabs: SegmentTab[] = [
    { id: 'values', label: Labels.BusinessSettingsTabSettings, icon: 'tune' },
    { id: 'history', label: Labels.BusinessSettingsTabHistory, icon: 'history' },
  ];
}
