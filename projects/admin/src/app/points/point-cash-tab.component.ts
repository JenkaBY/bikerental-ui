import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-point-cash-tab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="p-4 md:p-6"></div>`,
})
export class PointCashTabComponent {}
