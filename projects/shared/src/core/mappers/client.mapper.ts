import type {
  ClientRequest,
  ClientResponse,
  ClientStatusRequest,
  ClientSummaryResponse,
  ClientUpdateRequest,
} from '@api-models';
import type {
  Client,
  ClientDetailsWrite,
  ClientRegistrationWrite,
  ClientStatusWrite,
  ClientSummary,
} from '../models/client.model';

export class ClientMapper {
  static fromSummaryResponse(r: ClientSummaryResponse): ClientSummary {
    return {
      slug: r.slug,
      displayName: r.displayName,
      legalName: r.legalName,
      currency: r.currency,
      status: r.status,
      createdAt: ClientMapper.toDate(r.createdAt),
    };
  }

  static fromResponse(r: ClientResponse): Client {
    return {
      ...ClientMapper.fromSummaryResponse(r),
      registrationNumber: r.registrationNumber || undefined,
      contactEmail: r.contactEmail || undefined,
      contactPhone: r.contactPhone || undefined,
      businessGeoLocationId: r.businessGeoLocationId,
      timeZone: r.timeZone,
      version: r.version,
      createdBy: r.createdBy || undefined,
      updatedAt: ClientMapper.toDate(r.updatedAt),
    };
  }

  static toRequest(w: ClientRegistrationWrite): ClientRequest {
    return {
      ...ClientMapper.details(w),
      currency: w.currency.trim().toUpperCase(),
      timeZone: w.timeZone,
    };
  }

  static toUpdateRequest(w: ClientDetailsWrite, expectedVersion: number): ClientUpdateRequest {
    return { ...ClientMapper.details(w), expectedVersion };
  }

  static toStatusRequest(w: ClientStatusWrite, expectedVersion: number): ClientStatusRequest {
    return { status: w.status, reason: w.reason.trim() || undefined, expectedVersion };
  }

  private static details(w: ClientDetailsWrite): Omit<ClientUpdateRequest, 'expectedVersion'> {
    return {
      displayName: w.displayName.trim(),
      legalName: w.legalName.trim(),
      registrationNumber: w.registrationNumber.trim() || undefined,
      contactEmail: w.contactEmail.trim() || undefined,
      contactPhone: w.contactPhone.trim() || undefined,
      businessGeoLocationId: w.businessGeoLocationId,
    };
  }

  private static toDate(value?: string): Date | undefined {
    return value ? new Date(value) : undefined;
  }
}
