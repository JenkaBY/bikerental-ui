import { PointContactsRequest, PointRequest, PointResponse, PointUpdateRequest } from '@api-models';
import { Point, PointContacts, PointWrite } from '../models';

export class PointMapper {
  static fromResponse(r: PointResponse): Point {
    return {
      slug: r.slug,
      name: r.name,
      geoLocationId: r.geoLocationId ?? null,
      timeZone: r.timeZone ?? null,
      contacts: {
        primaryPhone: r.contacts.primaryPhone,
        additionalPhone: r.contacts.additionalPhone,
        email: r.contacts.email,
      },
      status: r.status,
    };
  }

  static toCreateRequest(w: PointWrite): PointRequest {
    return { slug: w.slug, ...PointMapper.toUpdateRequest(w) };
  }

  static toUpdateRequest(w: PointWrite): PointUpdateRequest {
    return {
      name: w.name,
      geoLocationId: w.geoLocationId,
      timeZone: w.timeZone,
      contacts: PointMapper.toContactsRequest(w.contacts),
    };
  }

  private static toContactsRequest(c: PointContacts): PointContactsRequest {
    return {
      primaryPhone: c.primaryPhone,
      additionalPhone: c.additionalPhone || undefined,
      email: c.email || undefined,
    };
  }
}
