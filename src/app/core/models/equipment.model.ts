export interface EquipmentRequest {
  serialNumber: string;
  uid?: string;
  typeSlug?: string;
  statusSlug?: string;
  model?: string;
  commissionedAt?: string;
  condition?: string;
}

export interface EquipmentResponse {
  id: number;
  serialNumber: string;
  uid?: string;
  type?: string;
  status?: string;
  model?: string;
  commissionedAt?: string;
  condition?: string;
}
