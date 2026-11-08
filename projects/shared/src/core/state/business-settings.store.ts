import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import type { SettingViewResponse } from '@api-models';
import { BusinessSettingsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { BusinessSettingMapper } from '../mappers/business-setting.mapper';
import { BusinessCurrencyStore, CURRENCY_CODE_KEY } from './business-currency.store';
import type { BusinessSetting, BusinessSettingChangeWrite } from '../models';

interface BusinessSettingsState {
  settings: BusinessSetting[];
  loading: boolean;
  loaded: boolean;
  error: boolean;
  saving: boolean;
  busyKeys: ReadonlySet<string>;
}

@Injectable()
export class BusinessSettingsStore {
  private readonly service = inject(BusinessSettingsService);
  private readonly currency = inject(BusinessCurrencyStore);

  private readonly _state = signal<BusinessSettingsState>({
    settings: [],
    loading: false,
    loaded: false,
    error: false,
    saving: false,
    busyKeys: new Set<string>(),
  });

  readonly settings = computed(() => this._state().settings);
  readonly loading = computed(() => this._state().loading);
  readonly loaded = computed(() => this._state().loaded);
  readonly error = computed(() => this._state().error);
  readonly saving = computed(() => this._state().saving);
  readonly busyKeys = computed(() => this._state().busyKeys);

  load(): void {
    this.patch({ loading: true, error: false });
    this.service
      .getAll()
      .pipe(
        map((response) =>
          (response as unknown as SettingViewResponse[]).map(BusinessSettingMapper.fromResponse),
        ),
        finalize(() => this.patch({ loading: false })),
      )
      .subscribe({
        next: (settings) => {
          this.patch({ settings, loaded: true });
          this.currency.applyFrom(settings);
        },
        error: () => this.patch({ error: true }),
      });
  }

  ensureLoaded(): void {
    const { loaded, loading } = this._state();
    if (!loaded && !loading) this.load();
  }

  change(key: string, write: BusinessSettingChangeWrite): Observable<BusinessSetting> {
    this.patch({ saving: true });
    return this.service
      .change(key, BusinessSettingMapper.toChangeRequest(write), undefined, {
        context: suppressErrorNotification(),
      })
      .pipe(
        map(BusinessSettingMapper.fromResponse),
        tap((setting) => this.replace(setting)),
        tap((setting) => this.refreshAfterCurrencyChange(setting.key)),
        finalize(() => this.patch({ saving: false })),
      );
  }

  reset(setting: BusinessSetting): Observable<BusinessSetting> {
    this.setBusy(setting.key, true);
    return this.service
      .reset(setting.key, BusinessSettingMapper.toResetRequest(setting.version), undefined, {
        context: suppressErrorNotification(),
      })
      .pipe(
        map(BusinessSettingMapper.fromResponse),
        tap((updated) => this.replace(updated)),
        tap((updated) => this.refreshAfterCurrencyChange(updated.key)),
        finalize(() => this.setBusy(setting.key, false)),
      );
  }

  private refreshAfterCurrencyChange(key: string): void {
    if (key === CURRENCY_CODE_KEY) this.load();
    else this.currency.applyFrom(this._state().settings);
  }

  private replace(setting: BusinessSetting): void {
    this._state.update((s) => ({
      ...s,
      settings: s.settings.map((item) => (item.key === setting.key ? setting : item)),
    }));
  }

  private setBusy(key: string, busy: boolean): void {
    this._state.update((s) => {
      const busyKeys = new Set(s.busyKeys);
      if (busy) {
        busyKeys.add(key);
      } else {
        busyKeys.delete(key);
      }
      return { ...s, busyKeys };
    });
  }

  private patch(partial: Partial<BusinessSettingsState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }
}
