export type RentalStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PatchOp = 'replace' | 'add';
export type PaymentMethod = 'CASH' | 'CARD' | 'ELECTRONIC';

export interface CreateRentalRequest {
  customerId: string;
  equipmentId: number;
  duration: string;
  tariffId?: number;
}

export interface RentalResponse {
  id: number;
  customerId?: string;
  equipmentId?: number;
  tariffId?: number;
  status: string;
  startedAt?: string;
  expectedReturnAt?: string;
  actualReturnAt?: string;
  plannedDurationMinutes?: number;
  actualDurationMinutes?: number;
  estimatedCost?: number;
  finalCost?: number;
}

export interface RentalSummaryResponse {
  id: number;
  customerId?: string;
  equipmentId?: number;
  status: string;
  startedAt?: string;
  expectedReturnAt?: string;
  overdueMinutes?: number;
}

export interface RentalPatchOperation {
  op: PatchOp;
  path: string;
  value?: unknown;
}

export interface RentalUpdateJsonPatchRequest {
  operations: RentalPatchOperation[];
}

export interface ReturnEquipmentRequest {
  rentalId?: number;
  equipmentId?: number;
  equipmentUid?: string;
  paymentMethod?: PaymentMethod;
  operatorId?: string;
}

export interface CostBreakdown {
  baseCost: number;
  overtimeCost: number;
  totalCost: number;
  actualMinutes: number;
  billableMinutes: number;
  plannedMinutes: number;
  overtimeMinutes: number;
  forgivenessApplied: boolean;
  calculationMessage?: string;
}

export interface Money {
  amount: number;
  zero?: boolean;
  negative?: boolean;
  positive?: boolean;
  negativeOrZero?: boolean;
}

export interface PaymentInfo {
  id: string;
  amount: Money;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  createdAt: string;
}

export interface RentalReturnResponse {
  rental: RentalResponse;
  cost: CostBreakdown;
  additionalPayment: number;
  paymentInfo?: PaymentInfo;
}

export interface RecordPrepaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  operatorId: string;
}

export interface PrepaymentResponse {
  paymentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  createdAt: string;
}
