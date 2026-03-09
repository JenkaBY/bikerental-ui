import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutModeService } from '../../../core/layout-mode.service';

@Component({
  selector: 'app-return',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Equipment Return</h1>

    @if (layout.isMobile()) {
      <p class="text-sm text-slate-500" i18n>
        QR scanner TODO — will be available on mobile layout
      </p>
    } @else {
      <p class="text-sm text-slate-500" i18n>
        QR scanner is available in mobile layout. Use manual UID entry instead.
      </p>
    }
  `,
})
export class ReturnComponent {
  protected layout = inject(LayoutModeService);
}
