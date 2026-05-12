import type { AvailableEquipmentResponse, EquipmentResponse } from '@api-models';
import type { EquipmentSearchItem, EquipmentType } from '@ui-models';

function createDefaultEquipmentType(slug?: string): EquipmentType {
  const value = slug ?? '';
  return { slug: value, name: value, isForSpecialTariff: false } as EquipmentType;
}

export class EquipmentSearchItemMapper {
  static fromResponse(r: EquipmentResponse, types: EquipmentType[] = []): EquipmentSearchItem {
    const type: EquipmentType =
      types.find((t) => t.slug === r.type) ?? createDefaultEquipmentType(r.type);

    return {
      id: r.id,
      uid: r.uid,
      model: r.model,
      type,
    };
  }

  static fromAvailableResponse(
    r: AvailableEquipmentResponse,
    types: EquipmentType[] = [],
  ): EquipmentSearchItem {
    const type: EquipmentType =
      types.find((t) => t.slug === r.typeSlug) ?? createDefaultEquipmentType(r.typeSlug);

    return {
      id: r.id ?? 0,
      uid: r.uid ?? '',
      model: r.model ?? '',
      type,
    };
  }
}
