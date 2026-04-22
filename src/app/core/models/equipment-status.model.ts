export interface EquipmentStatus {
  slug: string;
  name: string;
  description?: string;
  allowedTransitions: string[];
}

export interface EquipmentStatusWrite {
  slug: string;
  name: string;
  description?: string;
  allowedTransitions: string[];
}
