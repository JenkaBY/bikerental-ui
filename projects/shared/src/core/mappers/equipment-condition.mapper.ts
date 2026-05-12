import type { EquipmentCondition, EquipmentConditionSlug } from '../models/equipment.model';

const CONDITION_NAMES: Record<EquipmentConditionSlug, string> = {
  GOOD: $localize`Good`,
  MAINTENANCE: $localize`Maintenance`,
  BROKEN: $localize`Broken`,
  DECOMMISSIONED: $localize`Decommissioned`,
};

export const EQUIPMENT_CONDITIONS: EquipmentCondition[] = (
  Object.keys(CONDITION_NAMES) as EquipmentConditionSlug[]
).map((slug) => ({ slug, name: CONDITION_NAMES[slug] }));

export class EquipmentConditionMapper {
  static fromSlug(slug: EquipmentConditionSlug): EquipmentCondition {
    return { slug, name: CONDITION_NAMES[slug] };
  }

  static fromSlugString(slug: string | undefined): EquipmentCondition | undefined {
    if (!slug) return undefined;
    const name = CONDITION_NAMES[slug as EquipmentConditionSlug];
    if (!name) return undefined;
    return { slug: slug as EquipmentConditionSlug, name };
  }
}
