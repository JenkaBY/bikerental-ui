import type { RecordDepositRequest, RecordWithdrawalRequest } from '@api-models';
import type { CustomerDepositWrite, CustomerWithdrawalWrite } from '../models';

export class CustomerFinanceMapper {
  static toRecordWithdrawalRequest(w: CustomerWithdrawalWrite): RecordWithdrawalRequest {
    return {
      idempotencyKey: w.idempotencyKey,
      customerId: w.customerId,
      amount: w.amount,
      paymentMethod: w.paymentMethod,
      operatorId: w.operatorId ?? '',
      ...(w.source ? { source: w.source } : {}),
      ...(w.sourceId ? { sourceId: w.sourceId } : {}),
    };
  }

  static toRecordDepositRequest(w: CustomerDepositWrite): RecordDepositRequest {
    return {
      idempotencyKey: w.idempotencyKey,
      customerId: w.customerId,
      amount: w.amount,
      paymentMethod: w.paymentMethod,
      operatorId: w.operatorId ?? '',
      ...(w.source ? { source: w.source } : {}),
      ...(w.sourceId ? { sourceId: w.sourceId } : {}),
    };
  }
}
