import type {
  DamageReportItemResponse,
  DamageReportResponse,
  DamageReportSummaryResponse,
  PenaltyResponse,
  RegisterDamageReportRequest,
} from '@api-models';
import type {
  DamageReport,
  DamageReportItem,
  DamageReportListItem,
  DamageReportWrite,
  Penalty,
} from '../models';
import { makeMoney } from './money.mapper';
import { EquipmentConditionMapper } from './equipment-condition.mapper';

export class DamageReportMapper {
  static fromResponse(r: DamageReportResponse): DamageReport {
    return {
      id: r.id ?? 0,
      rentalId: r.rentalId,
      customerId: r.customerId,
      items: (r.items ?? []).map(DamageReportMapper.fromItemResponse),
      description: r.description ?? '',
      reportedAt: r.reportedAt ? new Date(r.reportedAt) : new Date(0),
      operatorId: r.operatorId ?? '',
      penalty: DamageReportMapper.fromPenaltyResponse(r.penalty),
    };
  }

  static fromSummary(r: DamageReportSummaryResponse): DamageReportListItem {
    return {
      id: r.id ?? 0,
      rentalId: r.rentalId,
      customerId: r.customerId,
      description: r.description ?? '',
      reportedAt: r.reportedAt ? new Date(r.reportedAt) : new Date(0),
      operatorId: r.operatorId ?? '',
      penalty:
        r.penaltyAmount != null && r.penaltyStatus
          ? {
              amount: makeMoney(r.penaltyAmount),
              status: r.penaltyStatus,
              transactionId: r.penaltyTransactionId,
              isSettled: r.penaltyStatus === 'SETTLED',
            }
          : undefined,
    };
  }

  static toRequest(w: DamageReportWrite): RegisterDamageReportRequest {
    return {
      equipmentIds: w.equipmentIds,
      rentalId: w.rentalId,
      customerId: w.customerId,
      condition: w.condition,
      description: w.description,
      penaltyAmount: w.penaltyAmount,
      idempotencyKey: w.idempotencyKey,
    };
  }

  private static fromItemResponse(item: DamageReportItemResponse): DamageReportItem {
    return {
      equipmentId: item.equipmentId ?? 0,
      equipmentUid: item.equipmentUid ?? '',
      previousCondition: EquipmentConditionMapper.fromSlugString(item.previousCondition),
      condition: EquipmentConditionMapper.fromSlugString(item.condition),
    };
  }

  private static fromPenaltyResponse(p: PenaltyResponse | undefined): Penalty | undefined {
    if (!p || p.amount == null || !p.status) return undefined;
    return {
      amount: makeMoney(p.amount),
      status: p.status,
      transactionId: p.transactionId,
      isSettled: p.status === 'SETTLED',
    };
  }
}
