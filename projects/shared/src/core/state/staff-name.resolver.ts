import { computed, DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { suppressErrorNotification } from '../errors/http-error-context';
import { Labels } from '../../shared/constant/labels';
import { ManagedUserStore } from './managed-user.store';

@Injectable()
export class StaffNameResolver {
  private readonly users = inject(ManagedUserStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly names = computed(() => {
    const names = new Map<string, string>();
    for (const user of this.users.users()) {
      const name = user.displayName || user.username;
      if (name) names.set(user.id, name);
    }
    return names;
  });

  readonly loading = computed(() => this.users.loading());

  ensureLoaded(): void {
    if (this.users.users().length > 0 || this.users.loading()) return;
    this.users
      .load({ context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => undefined });
  }

  nameFor(userId: string | null | undefined): string {
    return (userId ? this.names().get(userId) : undefined) ?? Labels.UnknownUser;
  }
}
