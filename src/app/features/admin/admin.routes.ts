import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'equipment', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () =>
      import('./layout/admin-placeholder.component').then((m) => m.AdminPlaceholderComponent),
  },
];
