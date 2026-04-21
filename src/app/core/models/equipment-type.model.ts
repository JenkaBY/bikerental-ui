export interface EquipmentType {
  slug: string;
  name: string;
  description?: string;
}

export interface EquipmentTypeWrite {
  slug: string;
  name?: string;
  description?: string;
}
