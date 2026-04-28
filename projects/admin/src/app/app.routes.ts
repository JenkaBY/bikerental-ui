import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
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
        path: 'equipment-statuses',
        loadComponent: () =>
          import('./equipment-statuses/equipment-status-list.component').then(
            (m) => m.EquipmentStatusListComponent,
          ),
      },
      {
        path: 'tariffs',
        loadComponent: () =>
          import('./tariffs/tariff-list.component').then((m) => m.TariffListComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./customers/customer-list.component').then((m) => m.CustomerListComponent),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import('./customers/customer-detail/customer-detail.component').then(
            (m) => m.CustomerDetailComponent,
          ),
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full',
          },
          {
            path: 'profile',
            loadComponent: () =>
              import('./customers/customer-detail/tabs/customer-profile/customer-profile.component').then(
                (m) => m.CustomerProfileComponent,
              ),
          },
          {
            path: 'rentals',
            loadComponent: () =>
              import('./customers/customer-detail/tabs/customer-rentals/customer-rentals.component').then(
                (m) => m.CustomerRentalsComponent,
              ),
          },
          {
            path: 'account',
            loadComponent: () =>
              import('./customers/customer-detail/tabs/customer-account/customer-account.component').then(
                (m) => m.CustomerAccountComponent,
              ),
          },
          {
            path: 'transactions',
            loadComponent: () =>
              import('./customers/customer-detail/tabs/customer-transactions/customer-transactions.component').then(
                (m) => m.CustomerTransactionsComponent,
              ),
          },
        ],
      },
      {
        path: 'rentals',
        loadComponent: () =>
          import('./rentals/rental-history.component').then((m) => m.RentalHistoryComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/payment-history.component').then((m) => m.PaymentHistoryComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/user-placeholder.component').then((m) => m.UserPlaceholderComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
