import { EquipmentRequest, EquipmentResponse } from '@api-models';
import { Equipment, EquipmentStatus, EquipmentType, EquipmentWrite } from '../models';
import { toIsoDate } from '../../shared/utils/date.util';
import { EquipmentConditionMapper } from './equipment-condition.mapper';

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
      conditionNotes: r.conditionNotes,
      condition: EquipmentConditionMapper.fromSlugString(r.condition),
    };
  }

  static toRequest(w: EquipmentWrite): EquipmentRequest {
    return {
      serialNumber: w.serialNumber,
      uid: w.uid || '',
      typeSlug: w.typeSlug,
      statusSlug: w.statusSlug,
      model: w.model,
      commissionedAt: w.commissionedAt ? toIsoDate(w.commissionedAt) : undefined,
      condition: w.conditionNotes,
      conditionSlug: w.conditionSlug,
    };
  }
}
