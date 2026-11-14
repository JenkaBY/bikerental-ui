import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, switchMap, tap } from 'rxjs/operators';
import type { SettingViewResponse } from '@api-models';
import { BusinessSettingsService } from '../api/generated';
import { GeoService } from '../api/geo/geo.service';
import { GeoLocationLookupStore } from './geo-location-lookup.store';
import { BusinessLocationStore } from './business-location.store';
import { suppressErrorNotification } from '../errors/http-error-context';
import { BusinessSettingMapper } from '../mappers/business-setting.mapper';
import { BusinessCurrencyStore, CURRENCY_CODE_KEY } from './business-currency.store';
import type { BusinessSetting, BusinessSettingChangeWrite, GeoLocationWrite } from '../models';

export function settingBusyKey(key: string, pointSlug?: string): string {
  return pointSlug ? `${key}@${pointSlug}` : key;
}

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
  private readonly geo = inject(GeoService);
  private readonly geoLookup = inject(GeoLocationLookupStore);
  private readonly businessLocation = inject(BusinessLocationStore);

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
          this.businessLocation.applyFrom(settings);
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

  changeGeoLocation(
    setting: BusinessSetting,
    write: GeoLocationWrite,
  ): Observable<BusinessSetting> {
    this.patch({ saving: true });
    return this.geo.saveLocation(write, { context: suppressErrorNotification() }).pipe(
      tap((location) => this.geoLookup.put(location)),
      switchMap((location) =>
        this.service.change(
          setting.key,
          BusinessSettingMapper.toChangeRequest({
            value: location.id,
            expectedVersion: setting.version,
          }),
          undefined,
          { context: suppressErrorNotification() },
        ),
      ),
      map(BusinessSettingMapper.fromResponse),
      tap((updated) => this.replace(updated)),
      tap((updated) => this.refreshAfterCurrencyChange(updated.key)),
      finalize(() => this.patch({ saving: false })),
    );
  }

  reset(setting: BusinessSetting, pointSlug?: string): Observable<BusinessSetting> {
    const busyKey = settingBusyKey(setting.key, pointSlug);
    const expectedVersion = pointSlug
      ? (setting.pointValues.find((p) => p.pointSlug === pointSlug)?.version ?? 0)
      : setting.version;
    this.setBusy(busyKey, true);
    return this.service
      .reset(
        setting.key,
        BusinessSettingMapper.toResetRequest({ expectedVersion, pointSlug }),
        undefined,
        { context: suppressErrorNotification() },
      )
      .pipe(
        map(BusinessSettingMapper.fromResponse),
        tap((updated) => this.replace(updated)),
        tap((updated) => this.refreshAfterCurrencyChange(updated.key)),
        finalize(() => this.setBusy(busyKey, false)),
      );
  }

  private refreshAfterCurrencyChange(key: string): void {
    if (key === CURRENCY_CODE_KEY) this.load();
    else this.currency.applyFrom(this._state().settings);
    this.businessLocation.applyFrom(this._state().settings);
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
