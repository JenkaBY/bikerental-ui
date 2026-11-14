import { computed, inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { GeoService } from '../api/geo/geo.service';
import type { GeoLocation } from '../models/geo.model';
import { Labels } from '../../shared/constant/labels';
import { formatGeoLocation } from '../../shared/utils/geo-location.util';

export function toGeoLocationId(value: unknown): number | null {
  const id = typeof value === 'string' ? Number(value) : value;
  return typeof id === 'number' && Number.isInteger(id) && id > 0 ? id : null;
}

@Injectable({ providedIn: 'root' })
export class GeoLocationLookupStore {
  private readonly geo = inject(GeoService);

  private readonly _byId = signal<ReadonlyMap<number, GeoLocation>>(new Map());
  private readonly _missing = signal<ReadonlySet<number>>(new Set());
  private readonly _pending = new Set<number>();

  readonly byId = computed(() => this._byId());

  ensure(ids: readonly unknown[]): void {
    const known = this._byId();
    const missing = this._missing();
    const wanted = [
      ...new Set(ids.map(toGeoLocationId).filter((id): id is number => id !== null)),
    ].filter((id) => !known.has(id) && !missing.has(id) && !this._pending.has(id));
    if (wanted.length === 0) return;
    wanted.forEach((id) => this._pending.add(id));
    this.geo
      .locations(wanted)
      .pipe(finalize(() => wanted.forEach((id) => this._pending.delete(id))))
      .subscribe({
        next: (locations) => {
          locations.forEach((location) => this.put(location));
          const found = new Set(locations.map((l) => l.id));
          const absent = wanted.filter((id) => !found.has(id));
          if (absent.length) this._missing.update((set) => new Set([...set, ...absent]));
        },
        error: () => void 0,
      });
  }

  put(location: GeoLocation): void {
    this._byId.update((map) => new Map(map).set(location.id, location));
  }

  describe(value: unknown): string {
    const id = toGeoLocationId(value);
    if (id === null) return '—';
    const location = this._byId().get(id);
    if (location) return formatGeoLocation(location);
    return this._missing().has(id) ? Labels.geoLocationUnknown(String(id)) : `#${id}`;
  }
}
