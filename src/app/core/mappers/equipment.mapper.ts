import { EquipmentRequest, EquipmentResponse } from '@api-models';
import { Equipment, EquipmentStatus, EquipmentType, EquipmentWrite } from '../models';

export class EquipmentMapper {
  static fromResponse(
    r: EquipmentResponse,
    types: EquipmentType[] = [],
    statuses: EquipmentStatus[] = [],
  ): Equipment {
    const type =
      types.find((t) => t.slug === r.type) ??
      ({ slug: r.type, name: r.type, isForSpecialTariff: false } as EquipmentType);

    const status =
      statuses.find((s) => s.slug === r.status) ??
      ({ slug: r.status, name: r.status, allowedTransitions: [] } as EquipmentStatus);

    return {
      id: r.id,
      serialNumber: r.serialNumber,
      uid: r.uid,
      type,
      status,
      model: r.model,
      commissionedAt: r.commissionedAt
        ? new Date(r.commissionedAt as unknown as string)
        : undefined,
      condition: r.condition,
    };
  }

  static toRequest(w: EquipmentWrite): EquipmentRequest {
    return {
      serialNumber: w.serialNumber,
      uid: w.uid,
      typeSlug: w.typeSlug,
      statusSlug: w.statusSlug,
      model: w.model,
      commissionedAt: w.commissionedAt,
      condition: w.condition,
    };
  }
}
