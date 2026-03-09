import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Active Rentals</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK010</p>
  `,
})
export class DashboardComponent {}
