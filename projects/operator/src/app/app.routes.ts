import { Routes } from '@angular/router';
import { OperatorShellWrapperComponent } from './layout/operator-shell-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    component: OperatorShellWrapperComponent,
    children: [
      { path: '', redirectTo: 'rentals', pathMatch: 'full' },
      {
        path: 'rentals',
        loadComponent: () =>
          import('./dashboard/rental-dashboard.component').then((m) => m.RentalDashboardComponent),
      },
      {
        path: 'rentals/new',
        loadComponent: () =>
          import('./rental-create/rental-create.component').then((m) => m.RentalCreateComponent),
      },
      {
        path: 'rentals/:id/edit',
        loadComponent: () =>
          import('./rental-create/rental-create.component').then((m) => m.RentalCreateComponent),
      },
      {
        path: 'rentals/:id',
        loadComponent: () =>
          import('./rental-detail/rental-detail.component').then((m) => m.RentalDetailComponent),
      },
      {
        path: 'return',
        loadComponent: () => import('./return/return.component').then((m) => m.ReturnComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
