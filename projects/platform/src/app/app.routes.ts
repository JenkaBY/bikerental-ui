import { Routes } from '@angular/router';
import {
  authGuard,
  ChangePasswordComponent,
  ForbiddenComponent,
  mustChangePasswordGuard,
  platformManagerGuard,
} from '@bikerental/shared';
import { PlatformLayoutComponent } from './layout/platform-layout.component';

export const routes: Routes = [
  { path: 'forbidden', component: ForbiddenComponent },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  {
    path: '',
    component: PlatformLayoutComponent,
    canActivate: [authGuard, mustChangePasswordGuard, platformManagerGuard],
    children: [
      { path: '', redirectTo: 'managers', pathMatch: 'full' },
      {
        path: 'managers',
        loadComponent: () =>
          import('./managers/managers-list.component').then((m) => m.ManagersListComponent),
      },
      {
        path: 'profile',
        loadChildren: () => import('@bikerental/shared').then((m) => m.PROFILE_SETTINGS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
