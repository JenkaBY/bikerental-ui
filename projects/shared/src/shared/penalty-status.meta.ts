import type { PenaltyStatus } from '../core/models/damage-report.model';
import { Labels } from './constant/labels';

export interface PenaltyStatusMeta {
  readonly status: PenaltyStatus;
  readonly label: string;
  readonly badgeClasses: string;
}

export const PenaltyStatusMetaMap: Record<PenaltyStatus, PenaltyStatusMeta> = {
  PENDING: {
    status: 'PENDING',
    label: Labels.PenaltyStatusPending,
    badgeClasses: 'bg-amber-100 text-amber-700',
  },
  SETTLED: {
    status: 'SETTLED',
    label: Labels.PenaltyStatusSettled,
    badgeClasses: 'bg-emerald-100 text-emerald-700',
  },
};

export function mapPenaltyStatus(status: PenaltyStatus): PenaltyStatusMeta {
  return PenaltyStatusMetaMap[status];
}
