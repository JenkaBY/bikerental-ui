# Task 002: Update UserStore.updatePreferences() to Call LocaleRedirectService

> **Applied Skills:** `angular-di` — inject `LocaleRedirectService` via `inject()` inside the store class body; `angular-signals` — capture the pre-update language value before mutating `_preferences` so the comparison is against the old state.

## 1. Objective

Modify `UserStore.updatePreferences()` to inject `LocaleRedirectService` and call `redirect()` when the incoming `patch.language` is defined and differs from the current preference language. The preference signal update and `localStorage` persistence (FR-04 `effect()`) run first; the redirect fires after — ensuring the new locale is already stored before the page reloads.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/user.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
// Add to the existing import block — one new import line after the UserProfile import:
import { LocaleRedirectService } from '../locale-redirect.service';
```

**Change 1 — add the `inject()` field:**

* **Location:** Add as the last `private readonly` field, directly below `private readonly _preferences`, before the first `readonly computed` property.

```typescript
  private readonly
localeRedirect = inject(LocaleRedirectService);
```

**Change 2 — replace `updatePreferences()`:**

* **Location:** Replace the entire existing `updatePreferences` method (currently the last method in the class).

```typescript
  updatePreferences(patch
:
Partial<UserPreferences>
):
void {
  const currentLanguage = this._preferences().language;
  this._preferences.update((current) => ({ ...current, ...patch }));
  if(patch.language !== undefined && patch.language !== currentLanguage
)
{
  this.localeRedirect.redirect(patch.language);
}
}
```

### Complete resulting file for reference

```typescript
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { DEFAULT_USER_PREFERENCES, UserPreferences } from '../models/user-preferences.model';
import { UserProfile } from '../models/user-profile.model';
import { LocaleRedirectService } from '../locale-redirect.service';

const PREFERENCES_STORAGE_KEY = 'user_preferences';

@Injectable({ providedIn: 'root' })
export class UserStore {
  private readonly _currentUser = signal<UserProfile | null>(null);
  private readonly _preferences = signal<UserPreferences>(DEFAULT_USER_PREFERENCES);
  private readonly localeRedirect = inject(LocaleRedirectService);

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
    const currentLanguage = this._preferences().language;
    this._preferences.update((current) => ({ ...current, ...patch }));
    if (patch.language !== undefined && patch.language !== currentLanguage) {
      this.localeRedirect.redirect(patch.language);
    }
  }
}
```

### Key Implementation Notes

| Point                                                  | Detail                                                                                                                                                            |
|--------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `const currentLanguage` before `_preferences.update()` | Captures the OLD language; after `update()` runs, `this._preferences().language` would already equal `patch.language`, making the comparison a no-op              |
| `patch.language !== undefined` guard                   | Allows `updatePreferences({ theme: 'dark' })` (no language key) without ever calling redirect                                                                     |
| `patch.language !== currentLanguage` guard             | Prevents a redundant `window.location.assign` when the caller sets the same language that is already stored (Scenario 2)                                          |
| `localeRedirect.redirect()` call position              | Fires AFTER `_preferences.update()` — the FR-04 `effect()` has already scheduled the `localStorage.setItem`; on reload the correct locale is restored immediately |
| `inject()` at field level                              | Follows project DI convention — never constructor injection                                                                                                       |

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT start the application server.

```bash
# Verify the shared library compiles without errors
npm run build -- --project shared

# Run the full shared test suite (redirect-integration spec is Task 005)
npx vitest run --project shared
```
