import { Routes } from '@angular/router';
import {
  authGuard,
  ChangePasswordComponent,
  customerProfileGuard,
  ForbiddenComponent,
  mustChangePasswordGuard,
  operatorGuard,
} from '@bikerental/shared';
import { OperatorLayoutComponent } from './layout/operator-layout.component';
import { financeReceiptGuard } from './cash/finance-receipt.guard';

export const routes: Routes = [
  { path: 'forbidden', component: ForbiddenComponent },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  {
    path: '',
    component: OperatorLayoutComponent,
    canActivate: [authGuard, mustChangePasswordGuard, operatorGuard],
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
        path: 'cash',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./cash/operator-cash.component').then((m) => m.OperatorCashComponent),
          },
          {
            path: 'collect/done',
            data: { fullScreen: true },
            canActivate: [financeReceiptGuard],
            loadComponent: () =>
              import('./cash/operator-finance-receipt.component').then(
                (m) => m.OperatorFinanceReceiptComponent,
              ),
          },
          {
            path: 'collect',
            data: { fullScreen: true },
            loadComponent: () =>
              import('./cash/operator-cash-collection.component').then(
                (m) => m.OperatorCashCollectionComponent,
              ),
          },
          {
            path: 'close-shift/done',
            data: { fullScreen: true },
            canActivate: [financeReceiptGuard],
            loadComponent: () =>
              import('./cash/operator-finance-receipt.component').then(
                (m) => m.OperatorFinanceReceiptComponent,
              ),
          },
          {
            path: 'close-shift',
            data: { fullScreen: true },
            loadComponent: () =>
              import('./cash/operator-shift-closure.component').then(
                (m) => m.OperatorShiftClosureComponent,
              ),
          },
        ],
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
