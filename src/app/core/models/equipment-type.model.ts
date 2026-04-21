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
