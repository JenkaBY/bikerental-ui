import { Routes } from '@angular/router';
import { OperatorLayoutComponent } from './layout/operator-layout.component';

export const OPERATOR_ROUTES: Routes = [
  {
    path: '',
    component: OperatorLayoutComponent,
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
];
