import type {
  CityResponse,
  CountryResponse,
  LocationRequest,
  LocationResponse,
  TimeZoneResponse,
} from '@api-models';
import type { GeoCity, GeoCountry, GeoLocation, GeoTimeZone } from '../models/geo.model';

export class GeoMapper {
  static countryFromResponse(r: CountryResponse): GeoCountry {
    return { code: r.code, name: r.name, defaultTimeZone: r.defaultTimeZone ?? null };
  }

  static cityFromResponse(r: CityResponse): GeoCity {
    return {
      id: r.id,
      name: r.name,
      region: r.region ?? null,
      timeZone: r.timeZone ?? null,
      suggestedTimeZone: r.suggestedTimeZone ?? null,
      userEntered: r.userEntered ?? false,
    };
  }

  static timeZoneFromResponse(r: TimeZoneResponse): GeoTimeZone {
    return { name: r.name, ofCountry: r.ofCountry ?? false };
  }

  static locationFromResponse(r: LocationResponse): GeoLocation {
    return {
      id: r.id,
      country: { code: r.country.code, name: r.country.name },
      city: {
        id: r.city.id,
        name: r.city.name,
        region: r.city.region ?? null,
        userEntered: r.city.userEntered ?? false,
      },
      street: r.street ?? null,
    };
  }

  static toLocationRequest(countryCode: string, cityId: number, street: string): LocationRequest {
    const trimmed = street.trim();
    return { country: countryCode, cityId, street: trimmed || undefined };
  }
}
