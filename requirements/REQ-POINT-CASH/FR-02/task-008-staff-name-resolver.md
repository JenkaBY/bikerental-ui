# Task 008: StaffNameResolver + ManagedUserStore.load(options)

> **Applied Skill:** `angular-di` - feature-scoped resolver wrapping the root `ManagedUserStore`. `error-handling` - the user-directory load is sent with `suppressErrorNotification()`; failure is silent and yields the placeholder (FR-02 NFR). Design FR-02 §2 - `nameFor(id)` -> display name, else username, else localized "Unknown user"; never the raw id (unlike `OperatorRevenueSource`). Loaded at most once per visit (no-op when users are loaded or loading).

## 1. Objective

Let `ManagedUserStore.load()` accept request options (backwards compatible), and create
`StaffNameResolver`, provided on the admin point-detail host.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/managed-user.store.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/state/staff-name.resolver.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** `projects/shared/src/core/state/managed-user.store.ts` - replace the two lines

```typescript
  load(): Observable<void> {
    this._loading.set(true);
    return this.service.list().pipe(
```

with:

```typescript
  load(options?: RequestOptions<'json'>): Observable<void> {
    this._loading.set(true);
    return this.service.list(undefined, options).pipe(
```

(`RequestOptions` is already imported in that file.) Existing callers `load()` keep working.

* **Location:** New file `projects/shared/src/core/state/staff-name.resolver.ts` - full content.
* **Snippet:**

```typescript
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
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below `export * from './core/state/point-money-refresh.facade';`
* **Snippet:**

```typescript
export * from './core/state/staff-name.resolver';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/managed-user.store.ts projects/shared/src/core/state/staff-name.resolver.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
