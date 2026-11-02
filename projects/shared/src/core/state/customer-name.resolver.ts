import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { CustomersService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { CustomerMapper } from '../mappers';

@Injectable({ providedIn: 'root' })
export class CustomerNameResolver {
  private readonly customers = inject(CustomersService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _names = signal<ReadonlyMap<string, string>>(new Map());
  private readonly requested = new Set<string>();

  ensureLoaded(ids: readonly (string | null | undefined)[]): void {
    for (const id of ids) {
      if (!id || this.requested.has(id)) continue;
      this.requested.add(id);
      this.customers
        .getById(id, 'body', { context: suppressErrorNotification() })
        .pipe(
          map((response) => CustomerMapper.fromResponse(response)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: (customer) => {
            const name = `${customer.firstName} ${customer.lastName}`.trim();
            if (name) this._names.update((names) => new Map(names).set(id, name));
          },
          error: () => this.requested.delete(id),
        });
    }
  }

  nameFor(customerId: string | null | undefined): string | undefined {
    return customerId ? this._names().get(customerId) : undefined;
  }
}
