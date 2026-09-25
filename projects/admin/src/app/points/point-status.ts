import { Labels } from '@bikerental/shared';
import type { PointStatus } from '@ui-models';

export const POINT_STATUS_LABELS: Record<PointStatus, string> = {
  ACTIVE: Labels.PointStatusActive,
  INACTIVE: Labels.PointStatusInactive,
  PERMANENTLY_CLOSED: Labels.PointStatusClosed,
};

export const POINT_STATUS_CLASSES: Record<PointStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-slate-100 text-slate-700',
  PERMANENTLY_CLOSED: 'bg-red-100 text-red-800',
};
