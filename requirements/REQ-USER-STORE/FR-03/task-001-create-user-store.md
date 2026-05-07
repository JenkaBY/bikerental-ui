# Task 001: Create UserStore Signal Service

> **Applied Skill:** `angular-data-flow-orchestrator` — Phase 3: Store Implementation (class-based Signal Store with `providedIn: 'root'`).
> **Applied Skill:** `angular-signals` — `signal()`, `computed()`, writable vs read-only signal boundaries.
> **Applied Skill:** `angular-di` — `inject()` pattern, singleton scoping with `providedIn: 'root'`.

## 1. Objective

Create `projects/shared/src/core/state/user.store.ts` — a globally scoped `@Injectable({ providedIn: 'root' })` signal service that is the single source of truth for the authenticated user's identity and preferences across both the `admin` and `operator` SPAs.

## 2. Files to Modify / Create

### 2a. New Store File

* **File Path:** `projects/shared/src/core/state/user.store.ts`
* **Action:** Create New File

### 2b. Library Barrel

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### 3a. New file — `user.store.ts`

**Imports Required:**

```typescript
import { computed, Injectable, signal } from '@angular/core';
import { DEFAULT_USER_PREFERENCES, UserPreferences } from '../models/user-preferences.model';
import { UserProfile } from '../models/user-profile.model';
```

**Code to Add:**

* **Location:** New file — entire contents

```typescript
import { computed, Injectable, signal } from '@angular/core';
import { DEFAULT_USER_PREFERENCES, UserPreferences } from '../models/user-preferences.model';
import { UserProfile } from '../models/user-profile.model';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly _currentUser = signal<UserProfile | null>(null);
  private readonly _preferences = signal<UserPreferences>(DEFAULT_USER_PREFERENCES);

  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRoles = computed(() => this._currentUser()?.roles ?? []);
  readonly preferences = computed(() => this._preferences());

  setUser(profile: UserProfile): void {
    this._currentUser.set(profile);
  }

  clearUser(): void {
    this._currentUser.set(null);
  }

  updatePreferences(patch: Partial<UserPreferences>): void {
    this._preferences.update((current) => ({ ...current, ...patch }));
  }
}
```

---

### 3b. Update barrel — `projects/shared/src/public-api.ts`

**Location:** Inside the `// Core — signal state stores` section, **after** the existing `export * from './core/state/customer.store';` line.

**Current block (exact text to match):**

```typescript
export * from './core/state/lookup-initializer.facade';
export * from './core/state/customer.store';
```

**Replace with:**

```typescript
export * from './core/state/lookup-initializer.facade';
export * from './core/state/customer.store';
export * from './core/state/user.store';
```

---

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
# Verify the shared library compiles without errors
npx ng build shared

# Run shared tests (the spec from Task 002 will also execute)
npx ng test shared --watch=false
```
