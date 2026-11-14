import type { GeoLocation } from '../../core/models/geo.model';

export function cityWithRegion(name: string, region: string | null | undefined): string {
  return region ? `${name} – ${region}` : name;
}

export function formatGeoLocation(location: GeoLocation | null | undefined): string {
  if (!location) return '';
  return [
    location.street,
    cityWithRegion(location.city.name, location.city.region),
    location.country.name,
  ]
    .filter((part): part is string => !!part)
    .join(', ');
}
