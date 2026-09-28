import { EquipmentType } from './equipment-type.model';

export type EquipmentConditionSlug = 'GOOD' | 'NEEDS_MAINTENANCE' | 'BROKEN' | 'DECOMMISSIONED';

export type EquipmentLocationState = 'AT_POINT' | 'IN_TRANSIT';

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
  pointSlug?: string;
  locationState: EquipmentLocationState;
}

export interface EquipmentWrite {
  serialNumber: string;
  uid?: string;
  typeSlug?: string;
  model?: string;
  commissionedAt?: Date;
  conditionNotes?: string;
  conditionSlug?: EquipmentConditionSlug;
  pointSlug: string;
}

export interface EquipmentSearchItem {
  readonly id: number;
  readonly uid: string;
  readonly model: string;
  readonly type: EquipmentType;
}
