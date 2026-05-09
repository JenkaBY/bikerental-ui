import { EquipmentType } from './equipment-type.model';
import { EquipmentStatus } from './equipment-status.model';

export interface Equipment {
  id: number;
  serialNumber: string;
  uid: string;
  type: EquipmentType;
  status: EquipmentStatus;
  model: string;
  commissionedAt?: Date;
  condition?: string;
}

export interface EquipmentWrite {
  serialNumber: string;
  uid?: string;
  typeSlug?: string;
  statusSlug?: string;
  model?: string;
  commissionedAt?: Date;
  condition?: string;
}

export interface EquipmentSearchItem {
  readonly id: number;
  readonly uid: string;
  readonly model: string;
  readonly type: EquipmentType;
}
