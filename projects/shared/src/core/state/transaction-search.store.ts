import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import { CustomersService, FinanceService } from '../api/generated';
import { TransactionMapper } from '../mappers/transaction.mapper';
import type { CustomerRef, LedgerType, Page, TransactionListItem } from '@ui-models';
import type { PageTransactionSummaryResponse } from '@api-models';
import { suppressErrorNotification } from '../errors/http-error-context';
import { toIsoDate } from '../../shared/utils/date.util';

const DEFAULT_SORT = ['recordedAt,desc'];

export interface TransactionSearchQuery {
  customerIds?: string[];
  ledgerTypes?: LedgerType[];
  sourceId?: string;
  from?: Date;
  to?: Date;
  pageIndex: number;
  pageSize: number;
  withCustomer?: boolean;
}

export interface TransactionSearchRow {
  readonly transaction: TransactionListItem;
  readonly customer?: CustomerRef;
}

const EMPTY_PAGE: Page<TransactionSearchRow> = { items: [], totalItems: 0 };

@Injectable()
export class TransactionSearchStore {
  private readonly financeService = inject(FinanceService);
  private readonly customersService = inject(CustomersService);

  private readonly _query = signal<TransactionSearchQuery | null>(null);
  private readonly _page = signal<Page<TransactionSearchRow>>(EMPTY_PAGE);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  readonly items = computed(() => this._page().items);
  readonly totalItems = computed(() => this._page().totalItems);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly pageIndex = computed(() => this._query()?.pageIndex ?? 0);
  readonly pageSize = computed(() => this._query()?.pageSize ?? 20);

  search(query: TransactionSearchQuery): void {
    this._query.set(query);
    this.fetch(query);
  }

  reload(): void {
    const query = this._query();
    if (query) this.fetch(query);
  }

  private fetch(query: TransactionSearchQuery): void {
    this._loading.set(true);
    this._error.set(false);
    this.financeService
      .findTransactions(
        {
          customerIds: query.customerIds?.length ? query.customerIds : undefined,
          ledgerTypes: query.ledgerTypes?.length ? query.ledgerTypes : undefined,
          sourceId: query.sourceId || undefined,
          sourceType: query.sourceId ? 'RENTAL' : undefined,
          fromDate: query.from ? toIsoDate(query.from) : undefined,
          toDate: query.to ? toIsoDate(query.to) : undefined,
        },
        { page: query.pageIndex, size: query.pageSize, sort: DEFAULT_SORT },
      )
      .pipe(
        switchMap((response) => this.enrich(response, query.withCustomer ?? false)),
        catchError(() => {
          this._error.set(true);
          return of<Page<TransactionSearchRow> | null>(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((page) => {
        if (page) this._page.set(page);
      });
  }

  private enrich(
    response: PageTransactionSummaryResponse,
    withCustomer: boolean,
  ): Observable<Page<TransactionSearchRow>> {
    const summaries = response.items ?? [];
    const transactions = summaries.map((item) => TransactionMapper.fromTransactionSummary(item));
    const totalItems = response.totalItems ?? 0;

    const customerIds = withCustomer
      ? [...new Set(summaries.map((s) => s.customerId).filter((id): id is string => id != null))]
      : [];

    return (
      customerIds.length
        ? this.customersService.getCustomersBatch(customerIds, 'body', {
            context: suppressErrorNotification(),
          })
        : of([])
    ).pipe(
      map((customers) => {
        const customerMap = new Map(customers.map((c) => [c.id, c]));
        const items = transactions.map((transaction) => {
          const c = withCustomer ? customerMap.get(transaction.customerId) : undefined;
          const customer: CustomerRef | undefined = c
            ? {
                id: c.id,
                phone: c.phone,
                name: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || undefined,
              }
            : undefined;
          return { transaction, customer };
        });
        return { items, totalItems };
      }),
      catchError(() =>
        of<Page<TransactionSearchRow>>({
          items: transactions.map((transaction) => ({ transaction })),
          totalItems,
        }),
      ),
    );
  }
}
