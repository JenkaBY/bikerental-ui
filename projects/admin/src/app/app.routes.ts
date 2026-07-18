import { Routes } from '@angular/router';
import {
  adminGuard,
  authGuard,
  ChangePasswordComponent,
  ForbiddenComponent,
  mustChangePasswordGuard,
} from '@bikerental/shared';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const routes: Routes = [
  { path: 'forbidden', component: ForbiddenComponent },
  { path: 'change-password', component: ChangePasswordComponent, canActivate: [authGuard] },
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard, mustChangePasswordGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'equipment', pathMatch: 'full' },
      {
        path: 'equipment',
        loadComponent: () =>
          import('./equipment/equipment-list.component').then((m) => m.EquipmentListComponent),
      },
      {
        path: 'equipment-types',
        loadComponent: () =>
          import('./equipment-types/equipment-type-list.component').then(
            (m) => m.EquipmentTypeListComponent,
          ),
      },
      {
        path: 'tariffs',
        loadComponent: () =>
          import('./tariffs/tariff-list.component').then((m) => m.TariffListComponent),
      },
      {
        path: 'agreements',
        loadComponent: () =>
          import('./agreements/agreement-list.component').then((m) => m.AgreementListComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./customers/customer-list.component').then((m) => m.CustomerListComponent),
      },
      {
        path: 'customers/:id',
        loadChildren: () => import('@bikerental/shared').then((m) => m.CUSTOMER_PROFILE_ROUTES),
      },
      {
        path: 'rentals',
        loadComponent: () =>
          import('./rentals/rental-history.component').then((m) => m.RentalListComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/payment-history.component').then((m) => m.PaymentHistoryComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/users-list.component').then((m) => m.UsersListComponent),
      },
      {
        path: 'profile',
        loadChildren: () => import('@bikerental/shared').then((m) => m.PROFILE_SETTINGS_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
