export interface EquipmentTypeRequest {
  slug: string;
  name?: string;
  description?: string;
}

export interface EquipmentTypeUpdateRequest {
  name?: string;
  description?: string;
}

export interface EquipmentTypeResponse {
  slug: string;
  name: string;
  description?: string;
}
