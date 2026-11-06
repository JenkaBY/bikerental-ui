import { Routes } from '@angular/router';

export const BUSINESS_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./business-settings-page.component').then((m) => m.BusinessSettingsPageComponent),
    children: [
      { path: '', redirectTo: 'values', pathMatch: 'full' },
      {
        path: 'values',
        loadComponent: () =>
          import('./business-setting-list.component').then((m) => m.BusinessSettingListComponent),
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./business-setting-history.component').then(
            (m) => m.BusinessSettingHistoryComponent,
          ),
      },
    ],
  },
];
