import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, Observable, tap } from 'rxjs';
import { FinanceService, TransactionResponse } from '../api/generated';
import type { CustomerBalance } from '@ui-models';
import { CustomerDepositWrite, CustomerWithdrawalWrite } from '@ui-models';
import { CustomerFinanceMapper } from '../mappers';
import { BalanceMapper } from '../mappers/balance.mapper';

@Injectable()
export class CustomerFinanceStore {
  private readonly service = inject(FinanceService);

  private readonly _customerId = signal<string | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _balanceError = signal(false);
  private readonly _balance = signal<CustomerBalance | null>(null);

  readonly customerId = computed(() => this._customerId());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());
  readonly balance = computed(() => this._balance());

  loadById(id: string): void {
    this._customerId.set(id);
    this.refreshBalance();
  }

  refreshBalance(): void {
    const id = this.customerId();
    if (!id) return;
    this._loading.set(true);
    this._balanceError.set(false);

    this.service
      .getBalances(id)
      .pipe(
        tap((response) => this._balance.set(BalanceMapper.fromBalanceResponse(response))),
        catchError(() => {
          this._balanceError.set(true);
          return EMPTY;
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  recordWithdrawal(request: CustomerWithdrawalWrite): Observable<TransactionResponse> {
    const req = CustomerFinanceMapper.toRecordWithdrawalRequest(request);
    return this.service.recordWithdrawal(req);
  }

  recordDeposit(request: CustomerDepositWrite): Observable<TransactionResponse> {
    const req = CustomerFinanceMapper.toRecordDepositRequest(request);
    return this.service.recordDeposit(req);
  }
}
