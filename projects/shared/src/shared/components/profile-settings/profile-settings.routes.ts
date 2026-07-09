import { Routes } from '@angular/router';
import { ProfileSettingsComponent } from './profile-settings.component';

export const PROFILE_SETTINGS_ROUTES: Routes = [
  {
    path: '',
    component: ProfileSettingsComponent,
    children: [
      { path: '', redirectTo: 'account', pathMatch: 'full' },
      {
        path: 'account',
        loadComponent: () =>
          import('./profile-account.component').then((m) => m.ProfileAccountComponent),
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./profile-security.component').then((m) => m.ProfileSecurityComponent),
      },
      {
        path: 'preferences',
        loadComponent: () =>
          import('./profile-preferences.component').then((m) => m.ProfilePreferencesComponent),
      },
      {
        path: 'connected',
        loadComponent: () =>
          import('./profile-connected.component').then((m) => m.ProfileConnectedComponent),
      },
    ],
  },
];
