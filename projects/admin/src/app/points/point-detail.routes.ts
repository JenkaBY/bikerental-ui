import { Routes } from '@angular/router';

export const POINT_DETAIL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./point-detail-page.component').then((m) => m.PointDetailPageComponent),
    children: [
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
      {
        path: 'profile',
        loadComponent: () =>
          import('./point-profile-tab.component').then((m) => m.PointProfileTabComponent),
      },
      {
        path: 'cash',
        loadComponent: () =>
          import('./point-cash-tab.component').then((m) => m.PointCashTabComponent),
      },
      {
        path: 'transfers',
        loadComponent: () =>
          import('./point-transfers-tab.component').then((m) => m.PointTransfersTabComponent),
      },
      {
        path: 'operations',
        loadComponent: () =>
          import('./point-operations-tab.component').then((m) => m.PointOperationsTabComponent),
      },
      {
        path: 'results',
        loadComponent: () =>
          import('./point-results-tab.component').then((m) => m.PointResultsTabComponent),
      },
    ],
  },
];
