# Task 001: Add localStorage Persistence to UserStore

> **Applied Skill:** `angular-signals` — `effect()` must be called inside an injection context (constructor); effects are scheduled asynchronously and batch rapid synchronous updates, preventing redundant writes.

## 1. Objective

Modify `UserStore` to seed `_preferences` from `localStorage` on construction and register an `effect()` that persists the preferences signal to `localStorage` on every change. No changes to the store's public API are required.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/user.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// Replace the existing import line:
import { computed, Injectable, signal } from '@angular/core';
// With:
import { computed, effect, Injectable, signal } from '@angular/core';
```

**Code to Add/Replace:**

* **Location:** Replace the entire contents of `user.store.ts` with the snippet below. The module-level constant `PREFERENCES_STORAGE_KEY` is placed above the class. The `constructor()` is inserted between the `preferences` computed signal and the `setUser` method.

```typescript
import { computed, effect, Injectable, signal } from '@angular/core';
import { DEFAULT_USER_PREFERENCES, UserPreferences } from '../models/user-preferences.model';
import { UserProfile } from '../models/user-profile.model';

const PREFERENCES_STORAGE_KEY = 'user_preferences';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly _currentUser = signal<UserProfile | null>(null);
  private readonly _preferences = signal<UserPreferences>(DEFAULT_USER_PREFERENCES);

  readonly currentUser = computed(() => this._currentUser());
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly userRoles = computed(() => this._currentUser()?.roles ?? []);
  readonly preferences = computed(() => this._preferences());

  constructor() {
    try {
      const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
      if (stored !== null) {
        this._preferences.set(JSON.parse(stored) as UserPreferences);
      }
    } catch {
      // Silently fall back to DEFAULT_USER_PREFERENCES
    }

    effect(() => {
      localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(this._preferences()));
    });
  }

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

### Key Implementation Notes

| Point                        | Detail                                                                                                                                        |
|------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|
| `PREFERENCES_STORAGE_KEY`    | Module-level constant; avoids magic strings; not exported                                                                                     |
| `try/catch` placement        | Wraps both `getItem` and `JSON.parse`; catches any `SyntaxError` or storage access failure                                                    |
| `if (stored !== null)` guard | Distinguishes a missing key (`null`) from a present key — avoids calling `JSON.parse(null)`                                                   |
| `as UserPreferences` cast    | No runtime schema validation per the design; the effect immediately overwrites any shape-invalid value on the next `updatePreferences()` call |
| `effect()` position          | Registered **after** the `try/catch` so it reads the already-seeded `_preferences` value on its first scheduled run                           |
| `setUser` / `clearUser`      | Remain unchanged; they write only to `_currentUser` — no `localStorage` interaction                                                           |

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT start the application server.

```bash

npm run test

```
