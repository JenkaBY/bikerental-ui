import { computed, inject, Injectable, signal } from '@angular/core';
import type { BusinessSetting, GeoLocation } from '../models';
import { GeoLocationLookupStore, toGeoLocationId } from './geo-location-lookup.store';

export const BUSINESS_GEO_LOCATION_KEY = 'app.business.geo-location-id';
export const BUSINESS_TIME_ZONE_KEY = 'app.business.time-zone';
export const BUSINESS_COUNTRY_KEY = 'app.business.country';

interface BusinessLocationState {
  geoLocationId: number | null;
  timeZone: string | null;
  countryCode: string | null;
}

@Injectable({ providedIn: 'root' })
export class BusinessLocationStore {
  private readonly lookup = inject(GeoLocationLookupStore);

  private readonly _state = signal<BusinessLocationState>({
    geoLocationId: null,
    timeZone: null,
    countryCode: null,
  });

  readonly geoLocationId = computed(() => this._state().geoLocationId);
  readonly timeZone = computed(() => this._state().timeZone);
  readonly location = computed<GeoLocation | null>(() => {
    const id = this._state().geoLocationId;
    return id ? (this.lookup.byId().get(id) ?? null) : null;
  });
  readonly zoneCountryCode = computed(
    () => this.location()?.country.code ?? this._state().countryCode,
  );

  applyFrom(settings: readonly BusinessSetting[]): void {
    const effective = (key: string): unknown =>
      settings.find((s) => s.key === key)?.effectiveValue ?? null;
    const text = (key: string): string | null => {
      const value = effective(key);
      return typeof value === 'string' && value ? value : null;
    };
    const geoLocationId = toGeoLocationId(effective(BUSINESS_GEO_LOCATION_KEY));
    this._state.set({
      geoLocationId,
      timeZone: text(BUSINESS_TIME_ZONE_KEY),
      countryCode: text(BUSINESS_COUNTRY_KEY),
    });
    this.lookup.ensure([geoLocationId]);
  }
}
