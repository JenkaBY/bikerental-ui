# Task 004: ManagedUserStore

> **Applied Skills:** `angular-signals` (signal-based state, computed/read-only exposure), `angular-di` (`providedIn: 'root'` singleton service via `inject()`), `error-handling` (mutation methods propagate errors to the caller rather than swallowing them, per FR-01's design step 6, and accept an optional `RequestOptions` passthrough so callers can attach `SUPPRESS_ERROR_NOTIFICATION`) — implements the store that loads and mutates the managed-user list, exposing `ManagedUser[]` and never retaining the one-time `temporaryPassword`.

## 1. Objective

Create `ManagedUserStore`, a `providedIn: 'root'` signal store exposing the full user list (`users`), `loading`/`saving` signals, and `load`/`create`/`update`/`resetPassword`/`deactivate` mutation methods that patch the in-memory list on success. `create`, `update`, `resetPassword`, and `deactivate` each accept an optional `RequestOptions<'json'>` second parameter forwarded verbatim to the generated `UsersService` call, so later dialog tasks (task-010, task-011) can pass `{ context: suppressErrorNotification() }` to opt out of the global error toast while they render their own inline error. `create` and `resetPassword` return the full `UserCreationResult` (including the plaintext password) to the caller as the resolved Observable value — the store itself never assigns that password to a signal or field.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/state/managed-user.store.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { RequestOptions, UsersService } from '../api/generated';
import { ManagedUserMapper } from '../mappers';
import type {
  ManagedUser,
  ManagedUserCreateWrite,
  ManagedUserUpdateWrite,
  UserCreationResult,
} from '../models';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { RequestOptions, UsersService } from '../api/generated';
import { ManagedUserMapper } from '../mappers';
import type {
  ManagedUser,
  ManagedUserCreateWrite,
  ManagedUserUpdateWrite,
  UserCreationResult,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ManagedUserStore {
  private readonly service = inject(UsersService);

  private readonly _users = signal<ManagedUser[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly users = computed(() => this._users());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.list().pipe(
      map((responses) => responses.map(ManagedUserMapper.fromResponse)),
      tap((users) => this._users.set(users)),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
    );
  }

  create(
    write: ManagedUserCreateWrite,
    options?: RequestOptions<'json'>,
  ): Observable<UserCreationResult> {
    this._saving.set(true);
    return this.service.create(ManagedUserMapper.toCreateRequest(write), undefined, options).pipe(
      map(ManagedUserMapper.fromCreationResponse),
      tap((result) => {
        this._users.set([...this._users(), result.user]);
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  update(
    id: string,
    write: ManagedUserUpdateWrite,
    options?: RequestOptions<'json'>,
  ): Observable<ManagedUser> {
    this._saving.set(true);
    return this.service
      .update(id, ManagedUserMapper.toUpdateRequest(write), undefined, options)
      .pipe(
        map(ManagedUserMapper.fromResponse),
        tap((updated) => {
          this._users.set(this._users().map((u) => (u.id === updated.id ? updated : u)));
        }),
        finalize(() => this._saving.set(false)),
      );
  }

  resetPassword(
    id: string,
    options?: RequestOptions<'json'>,
  ): Observable<UserCreationResult> {
    this._saving.set(true);
    return this.service.resetPassword(id, undefined, options).pipe(
      map(ManagedUserMapper.fromCreationResponse),
      tap((result) => {
        this._users.set(this._users().map((u) => (u.id === result.user.id ? result.user : u)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  deactivate(id: string, options?: RequestOptions<'json'>): Observable<ManagedUser> {
    this._saving.set(true);
    return this.service.deactivate(id, undefined, options).pipe(
      map(ManagedUserMapper.fromResponse),
      tap((deactivated) => {
        this._users.set(this._users().map((u) => (u.id === deactivated.id ? deactivated : u)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }
}
```

**Note on error handling:** unlike `TariffStore.load()` (which swallows load errors with `catchError(() => EMPTY)`), this store's `load()` and all mutation methods deliberately do **not** catch errors — they propagate to the caller so `UsersListComponent` (task-009) and the dialogs (task-010, task-011) can surface them via `ApiErrorParser`/`NotificationService`/`applyServerErrors`, per FR-01's design step 6 ("the store does not mutate its list signal and re-throws/propagates the error to the caller").

**Note on `temporaryPassword`:** `create()` and `resetPassword()` map the full `UserCreationResult` (including `temporaryPassword`) through as the Observable's resolved value, but only `tap((result) => ... result.user ...)` ever touches a store signal — `temporaryPassword` is never assigned to `_users` or any other field, satisfying FR-01's Scenario 6.

**Note on the generated service's `update`/`create`/`resetPassword`/`deactivate` overload shape:** each generated method's signature is `(id, body, observe?, options?)` or `(body, observe?, options?)` — passing `undefined` explicitly for `observe` before `options` selects the default `'body'` overload while still letting `options` (e.g. `{ context: suppressErrorNotification() }`) reach the generated method, matching how `UsersService` is generated in `projects/shared/src/core/api/generated/services/users.service.ts`.

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
