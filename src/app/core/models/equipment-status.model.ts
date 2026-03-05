export interface EquipmentStatusRequest {
  slug?: string;
  name?: string;
  description?: string;
  allowedTransitions?: string[];
}

export interface EquipmentStatusResponse {
  slug: string;
  name: string;
  description?: string;
  allowedTransitions?: string[];
}
