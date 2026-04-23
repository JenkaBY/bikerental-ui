import { EquipmentStatusRequest, EquipmentStatusResponse } from '@api-models';
import { EquipmentStatus, EquipmentStatusWrite } from '../models';

export class EquipmentStatusMapper {
  static fromResponse(r: EquipmentStatusResponse): EquipmentStatus {
    return {
      slug: r.slug,
      name: r.name,
      description: r.description,
      allowedTransitions: r.allowedTransitions ?? [],
    };
  }

  static toCreateRequest(w: EquipmentStatusWrite): EquipmentStatusRequest {
    return {
      slug: w.slug,
      name: w.name,
      description: w.description,
      allowedTransitions: w.allowedTransitions,
    };
  }

  static toUpdateRequest(w: EquipmentStatusWrite): EquipmentStatusRequest {
    return {
      name: w.name,
      description: w.description,
      allowedTransitions: w.allowedTransitions,
    };
  }
}
