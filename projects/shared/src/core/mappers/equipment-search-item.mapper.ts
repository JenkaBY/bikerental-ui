import type { EquipmentResponse } from '@api-models';
import type { EquipmentSearchItem, EquipmentType } from '@ui-models';

export class EquipmentSearchItemMapper {
  static fromResponse(r: EquipmentResponse, types: EquipmentType[] = []): EquipmentSearchItem {
    const type: EquipmentType =
      types.find((t) => t.slug === r.type) ??
      ({ slug: r.type, name: r.type, isForSpecialTariff: false } as EquipmentType);

    return {
      id: r.id,
      uid: r.uid,
      model: r.model,
      type,
    };
  }
}
