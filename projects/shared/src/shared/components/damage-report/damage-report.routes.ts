import { Routes } from '@angular/router';

export const DAMAGE_REPORT_ROUTES: Routes = [
  {
    path: ':id',
    loadComponent: () =>
      import('./damage-report-detail.component').then((m) => m.DamageReportDetailComponent),
  },
];
