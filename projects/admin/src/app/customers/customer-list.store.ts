import { computed, inject, Injectable, signal } from '@angular/core';
import { debounce, distinctUntilChanged, filter, map, timer } from 'rxjs';
import { api, Customer, CustomerMapper } from '@bikerental/shared';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';

interface SearchRequest {
  phone: string | null;
}

@Injectable()
export class CustomerListStore {
  private readonly customersService = inject(api.CustomersService);
  private readonly _query = signal<string | null>(null);
  private readonly _debouncedQuery = toSignal(
    toObservable(this._query).pipe(
      debounce((query) => (query === null ? timer(0) : timer(300))),
      distinctUntilChanged(),
      filter((q) => q === null || q.length >= 4),
    ),
    { initialValue: null },
  );

  readonly resource = rxResource<Customer[], SearchRequest>({
    params: () => ({ phone: this._debouncedQuery() }),
    stream: (request) => {
      return this.customersService
        .searchByPhone(request.params.phone)
        .pipe(map((res) => res.map(CustomerMapper.fromResponse)));
    },
  });

  readonly customers = computed(() => this.resource.value() ?? []);
  readonly loading = this.resource.isLoading;
  readonly searchQuery = this._query.asReadonly();

  search(phone: string | null) {
    const value = phone?.trim() === '' ? null : phone;
    this._query.set(value);
  }
}
