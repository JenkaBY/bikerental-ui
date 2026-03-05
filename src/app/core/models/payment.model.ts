import { PaymentMethod } from './rental.model';

export type PaymentType = 'PREPAYMENT' | 'ADDITIONAL_PAYMENT' | 'ACCESSORY' | 'OTHER';

export interface RecordPaymentRequest {
  rentalId?: number;
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  operatorId?: string;
}

export interface RecordPaymentResponse {
  paymentId: string;
  receiptNumber: string;
}

export interface PaymentResponse {
  id: string;
  rentalId: number;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  createdAt: string;
  operatorId?: string;
  receiptNumber?: string;
}
