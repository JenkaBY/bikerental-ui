import type { ClientPointResponse } from '@api-models';
import type { ClientPoint } from '../models/client-point.model';

export class ClientPointMapper {
  static fromResponse(r: ClientPointResponse): ClientPoint {
    return {
      slug: r.slug,
      name: r.name,
      geoLocationId: r.geoLocationId ?? null,
      timeZone: r.timeZone ?? null,
      status: r.status,
    };
  }
}
