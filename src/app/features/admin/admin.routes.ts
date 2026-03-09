import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
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
];
