import type { EquipmentResponse } from '@api-models';
import type { EquipmentSearchItem } from '@ui-models';

export class EquipmentSearchItemMapper {
  static fromResponse(r: EquipmentResponse): EquipmentSearchItem {
    return {
      id: r.id,
      uid: r.uid,
      model: r.model,
      typeSlug: r.type,
      statusSlug: r.status,
    };
  }
}
