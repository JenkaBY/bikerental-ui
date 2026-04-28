import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, EMPTY, finalize, map, Observable } from 'rxjs';
import { CustomersService } from '../api/generated';
import { CustomerMapper } from '../mappers';
import type { Customer, CustomerWrite } from '@ui-models';
import { tap } from 'rxjs/operators';

@Injectable()
export class CustomerStore {
  private readonly service = inject(CustomersService);

  private readonly _customer = signal<Customer | null>(null);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly customer = computed(() => this._customer());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  loadById(id: string): void {
    if (!id) return;
    this._loading.set(true);

    this.service
      .getById(id)
      .pipe(
        map((response) => CustomerMapper.fromResponse(response)),
        tap((customer) => this._customer.set(customer)),
        catchError(() => {
          this._customer.set(null);
          return EMPTY;
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe();
  }

  create(write: CustomerWrite): Observable<Customer> {
    this._saving.set(true);
    return this.service.createCustomer(CustomerMapper.toRequest(write)).pipe(
      map((r) => CustomerMapper.fromResponse(r)),
      finalize(() => this._saving.set(false)),
    );
  }

  update(id: string, write: CustomerWrite) {
    this._saving.set(true);
    return this.service.updateCustomer(id, CustomerMapper.toRequest(write)).pipe(
      map((r) => {
        const mapped = CustomerMapper.fromResponse(r);
        this._customer.set(mapped);
        return mapped;
      }),
      finalize(() => this._saving.set(false)),
    );
  }
}
