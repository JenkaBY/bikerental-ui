import { computed, inject, Injectable, signal } from '@angular/core';
import { debounce, distinctUntilChanged, map, of, timer } from 'rxjs';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { CustomersService } from '../api/generated';
import { CustomerMapper } from '../mappers';
import type { Customer } from '@ui-models';

interface SearchRequest {
  phone: string | null;
}

const MIN_SEARCH_LENGTH = 4;

@Injectable()
export class CustomerListStore {
  private readonly customersService = inject(CustomersService);
  private readonly _query = signal<string | null>(null);
  private readonly _debouncedQuery = toSignal(
    toObservable(this._query).pipe(
      debounce((query) => (query === null ? timer(0) : timer(300))),
      distinctUntilChanged(),
    ),
    { initialValue: null },
  );

  readonly resource = rxResource<Customer[], SearchRequest>({
    params: () => ({ phone: this._debouncedQuery() }),
    stream: (request) => {
      const phone = request.params.phone;
      if (!phone || phone.length < MIN_SEARCH_LENGTH) {
        return of([]);
      }
      return this.customersService
        .getAll(phone)
        .pipe(map((res) => res.map(CustomerMapper.fromSearchResponse)));
    },
  });

  readonly customers = computed(() => this.resource.value() ?? []);
  readonly loading = this.resource.isLoading;
  readonly searchQuery = this._query.asReadonly();

  search(phone: string | null) {
    const digits = phone?.replace(/\D+/g, '') ?? '';
    this._query.set(digits.length === 0 ? null : digits);
  }
}
