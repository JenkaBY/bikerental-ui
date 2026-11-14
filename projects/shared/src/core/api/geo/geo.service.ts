import { inject, Injectable } from '@angular/core';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { GeographyService, RequestOptions } from '../generated';
import { GeoMapper } from '../../mappers/geo.mapper';
import {
  GEO_CITY_PAGE_SIZE,
  GEO_LOCATIONS_BATCH_MAX,
  type GeoCity,
  type GeoCountry,
  type GeoCountryTimeZone,
  type GeoLocation,
  type GeoLocationWrite,
} from '../../models/geo.model';

export class GeoLocationSaveError extends Error {
  constructor(cause: unknown) {
    super('geo location save failed', { cause });
  }
}

@Injectable({ providedIn: 'root' })
export class GeoService {
  private readonly api = inject(GeographyService);

  countries(query?: string): Observable<GeoCountry[]> {
    return this.api
      .searchCountries(query?.trim() || undefined)
      .pipe(map((items) => items.map(GeoMapper.countryFromResponse)));
  }

  cities(countryCode: string, query?: string): Observable<GeoCity[]> {
    return this.api
      .searchCities(countryCode, query?.trim() || undefined, 0, GEO_CITY_PAGE_SIZE)
      .pipe(map((page) => (page.items ?? []).map(GeoMapper.cityFromResponse)));
  }

  countryTimeZones(countryCode: string): Observable<GeoCountryTimeZone[]> {
    return this.api
      .listCountryTimeZones(countryCode)
      .pipe(map((items) => items.map(GeoMapper.countryTimeZoneFromResponse)));
  }

  location(id: number): Observable<GeoLocation> {
    return this.api.getLocation(id).pipe(map(GeoMapper.locationFromResponse));
  }

  locations(ids: readonly number[]): Observable<GeoLocation[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return of([]);
    const chunks: number[][] = [];
    for (let i = 0; i < unique.length; i += GEO_LOCATIONS_BATCH_MAX) {
      chunks.push(unique.slice(i, i + GEO_LOCATIONS_BATCH_MAX));
    }
    return forkJoin(chunks.map((chunk) => this.api.getLocations(chunk))).pipe(
      map((pages) => pages.flat().map(GeoMapper.locationFromResponse)),
    );
  }

  saveLocation(write: GeoLocationWrite, options?: RequestOptions<'json'>): Observable<GeoLocation> {
    return this.resolveCity(write.countryCode, write.city, options).pipe(
      switchMap((city) =>
        this.api.createLocation(
          GeoMapper.toLocationRequest(write.countryCode, city.id, write.street),
          undefined,
          options,
        ),
      ),
      map(GeoMapper.locationFromResponse),
      catchError((err: unknown) => throwError(() => new GeoLocationSaveError(err))),
    );
  }

  private resolveCity(
    countryCode: string,
    city: GeoCity | string,
    options?: RequestOptions<'json'>,
  ): Observable<GeoCity> {
    if (typeof city !== 'string') return of(city);
    return this.api
      .createCity(countryCode, { name: city.trim() }, undefined, options)
      .pipe(map(GeoMapper.cityFromResponse));
  }
}
