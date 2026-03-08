import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-tariff-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Tariffs</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK008</p>
  `,
})
export class TariffListComponent {}
