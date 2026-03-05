import { Routes } from '@angular/router';

export const OPERATOR_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () =>
      import('./layout/operator-placeholder.component').then((m) => m.OperatorPlaceholderComponent),
  },
];
