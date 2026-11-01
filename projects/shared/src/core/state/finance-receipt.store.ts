import { Injectable } from '@angular/core';
import type { FinanceReceipt } from '../models';

@Injectable({ providedIn: 'root' })
export class FinanceReceiptStore {
  private receipt: FinanceReceipt | null = null;

  set(receipt: FinanceReceipt): void {
    this.receipt = receipt;
  }

  take(): FinanceReceipt | null {
    const current = this.receipt;
    this.receipt = null;
    return current;
  }

  has(): boolean {
    return this.receipt !== null;
  }

  clear(): void {
    this.receipt = null;
  }
}
