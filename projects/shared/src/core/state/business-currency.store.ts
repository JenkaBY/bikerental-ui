import { computed, inject, Injectable, signal } from '@angular/core';
import type { SettingViewResponse } from '@api-models';
import { catchError, EMPTY } from 'rxjs';
import { BusinessSettingsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { BusinessSettingMapper } from '../mappers/business-setting.mapper';
import type { BusinessSetting } from '../models';
import { BusinessLocationStore } from './business-location.store';

export const CURRENCY_CODE_KEY = 'app.business.currency';
export const CURRENCY_SYMBOL_KEY = 'app.business.currency-symbol';

interface BusinessCurrencyState {
  code: string;
  symbol: string;
}

@Injectable({ providedIn: 'root' })
export class BusinessCurrencyStore {
  private readonly service = inject(BusinessSettingsService);
  private readonly businessLocation = inject(BusinessLocationStore);

  private readonly _state = signal<BusinessCurrencyState>({ code: '', symbol: '' });

  readonly code = computed(() => this._state().code);
  readonly symbol = computed(() => this._state().symbol || this._state().code);

  load(): void {
    this.service
      .getAll(undefined, { context: suppressErrorNotification() })
      .pipe(catchError(() => EMPTY))
      .subscribe((response) => {
        const settings = (response as unknown as SettingViewResponse[]).map(
          BusinessSettingMapper.fromResponse,
        );
        this.applyFrom(settings);
        this.businessLocation.applyFrom(settings);
      });
  }

  applyFrom(settings: readonly BusinessSetting[]): void {
    const read = (key: string): string => {
      const value = settings.find((s) => s.key === key)?.effectiveValue;
      return typeof value === 'string' ? value : '';
    };
    this._state.set({ code: read(CURRENCY_CODE_KEY), symbol: read(CURRENCY_SYMBOL_KEY) });
  }
}
