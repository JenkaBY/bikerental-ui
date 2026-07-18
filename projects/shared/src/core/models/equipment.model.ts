import { EquipmentType } from './equipment-type.model';

export type EquipmentConditionSlug = 'GOOD' | 'MAINTENANCE' | 'BROKEN' | 'DECOMMISSIONED';

export interface EquipmentCondition {
  slug: EquipmentConditionSlug;
  name: string;
}

export interface Equipment {
  id: number;
  serialNumber: string;
  uid: string;
  type: EquipmentType;
  model: string;
  commissionedAt?: Date;
  conditionNotes?: string;
  condition?: EquipmentCondition;
}

export interface EquipmentWrite {
  serialNumber: string;
  uid?: string;
  typeSlug?: string;
  model?: string;
  commissionedAt?: Date;
  conditionNotes?: string;
  conditionSlug?: EquipmentConditionSlug;
}

export interface EquipmentSearchItem {
  readonly id: number;
  readonly uid: string;
  readonly model: string;
  readonly type: EquipmentType;
}
