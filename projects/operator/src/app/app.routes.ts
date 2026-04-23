import { Routes } from '@angular/router';
import { OperatorShellWrapperComponent } from './layout/operator-shell-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    component: OperatorShellWrapperComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'rental/new',
        loadComponent: () =>
          import('./rental-create/rental-create.component').then((m) => m.RentalCreateComponent),
      },
      {
        path: 'return',
        loadComponent: () => import('./return/return.component').then((m) => m.ReturnComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
