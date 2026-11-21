import { computed, inject, Injectable, signal } from '@angular/core';
import type { SettingViewResponse } from '@api-models';
import { catchError, EMPTY } from 'rxjs';
import { BusinessSettingsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { BusinessSettingMapper } from '../mappers/business-setting.mapper';
import type { BusinessSetting } from '../models';

export const CURRENCY_SYMBOL_KEY = 'app.business.currency-symbol';

@Injectable({ providedIn: 'root' })
export class BusinessCurrencyStore {
  private readonly service = inject(BusinessSettingsService);

  private readonly _symbol = signal('');

  readonly symbol = computed(() => this._symbol());

  load(): void {
    this.service
      .getAll(undefined, { context: suppressErrorNotification() })
      .pipe(catchError(() => EMPTY))
      .subscribe((response) => {
        const settings = (response as unknown as SettingViewResponse[]).map(
          BusinessSettingMapper.fromResponse,
        );
        this.applyFrom(settings);
      });
  }

  applyFrom(settings: readonly BusinessSetting[]): void {
    const value = settings.find((s) => s.key === CURRENCY_SYMBOL_KEY)?.effectiveValue;
    this._symbol.set(typeof value === 'string' ? value : '');
  }
}
