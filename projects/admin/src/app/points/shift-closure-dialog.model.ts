import type { RunningShift } from '@bikerental/shared';

export interface ShiftClosureDialogData {
  readonly pointSlug: string;
  readonly pointName: string;
  readonly shift: RunningShift;
}

export interface ShiftClosureDialogResult {
  readonly outcome: 'done' | 'shiftChanged';
}
