import { PointContactsRequest, PointRequest, PointResponse, PointUpdateRequest } from '@api-models';
import { Point, PointContacts, PointWrite } from '../models';

export class PointMapper {
  static fromResponse(r: PointResponse): Point {
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      address: { street: r.address.street, city: r.address.city, country: r.address.country },
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
      address: { street: w.address.street, city: w.address.city, country: w.address.country },
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
