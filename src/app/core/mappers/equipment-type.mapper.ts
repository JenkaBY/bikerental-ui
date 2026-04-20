import {
  EquipmentType,
  EquipmentTypeRequest,
  EquipmentTypeResponse,
  EquipmentTypeUpdateRequest,
  EquipmentTypeWrite,
} from '../models';

export class EquipmentTypeMapper {
  static fromResponse(r: EquipmentTypeResponse): EquipmentType {
    return { slug: r.slug, name: r.name, description: r.description };
  }

  static toCreateRequest(w: EquipmentTypeWrite): EquipmentTypeRequest {
    return { slug: w.slug, name: w.name, description: w.description };
  }

  static toUpdateRequest(w: EquipmentTypeWrite): EquipmentTypeUpdateRequest {
    return { name: w.name, description: w.description };
  }
}
