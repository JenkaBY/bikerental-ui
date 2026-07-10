import { Routes } from '@angular/router';

export const CUSTOMER_PROFILE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./customer-detail.component').then((m) => m.CustomerDetailComponent),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./tabs/customer-profile/customer-profile.component').then(
            (m) => m.CustomerProfileComponent,
          ),
      },
      {
        path: 'rentals',
        loadComponent: () =>
          import('./tabs/customer-rentals/customer-rentals.component').then(
            (m) => m.CustomerRentalsComponent,
          ),
      },
      {
        path: 'account',
        loadComponent: () =>
          import('./tabs/customer-account/customer-account.component').then(
            (m) => m.CustomerAccountComponent,
          ),
      },
      {
        path: 'transactions',
        loadComponent: () =>
          import('./tabs/customer-transactions/customer-transactions.component').then(
            (m) => m.CustomerTransactionsComponent,
          ),
      },
    ],
  },
];
