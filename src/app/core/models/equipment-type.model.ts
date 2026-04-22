export interface EquipmentType {
  slug: string;
  name: string;
  description?: string;
  // functional flags
  isForSpecialTariff: boolean;
  // ui presentation
}

export interface EquipmentTypeWrite {
  slug: string;
  name?: string;
  description?: string;
}

export const FALLBACK_EQUIPMENT_TYPE: EquipmentType = {
  slug: 'MUST_NOT_BE_DISPLAYED',
  name: 'Call to developer!',
  description: 'Must not be anywhere',
  isForSpecialTariff: false,
};
