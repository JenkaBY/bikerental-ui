import { Routes } from '@angular/router';
import { customerProfileGuard } from '@bikerental/shared';
import { OperatorLayoutComponent } from './layout/operator-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: OperatorLayoutComponent,
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
        path: 'rentals/:id/agreement',
        loadComponent: () =>
          import('./rental-agreement/rental-agreement.component').then(
            (m) => m.RentalAgreementComponent,
          ),
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
      {
        path: 'damage-reports',
        loadChildren: () => import('@bikerental/shared').then((m) => m.DAMAGE_REPORT_ROUTES),
      },
      {
        path: 'customers/:id',
        canActivate: [customerProfileGuard],
        loadChildren: () => import('@bikerental/shared').then((m) => m.CUSTOMER_PROFILE_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () => import('@bikerental/shared').then((m) => m.PROFILE_SETTINGS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
