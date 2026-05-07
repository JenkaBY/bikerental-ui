# System Design: FR-03 — Global UserStore Signal Service

## 1. Architectural Overview

This story introduces `UserStore` — a globally scoped, `providedIn: 'root'` injectable signal service — into the `shared` library's `core/state/` layer. It follows the established store pattern already present in `EquipmentTypeStore`, `TariffStore`, and others, but differs in two key respects: it holds authentication-domain state (identity + preferences) rather than API-fetched lookup data, and its writable signals are mutated exclusively through named mutation methods rather than by loading from HTTP endpoints.

`UserStore` acts as the single source of truth for the currently authenticated user across both the `admin` and `operator` SPAs. It depends on the `UserProfile` model (FR-01) and `UserPreferences` model (FR-02) and will be consumed by the persistence layer (FR-04) and the locale-redirect logic (FR-05). The store itself performs no HTTP calls and has no dependency on the generated API client.

## 2. Impacted Components

* **`shared/core/state/` (Signal Store Layer):**
  Must receive a new `user.store.ts` file declaring the `UserStore` `@Injectable({ providedIn: 'root' })` class. The store exposes only read-only computed signals publicly; all writable signals are private. It depends on `UserProfile` (FR-01), `UserPreferences`, and `DEFAULT_USER_PREFERENCES` (FR-02).

* **`shared/public-api.ts` (Library Barrel):**
  Must export `UserStore` so that `admin` and `operator` apps can inject it without referencing internal library paths.

## 3. Abstract Data Schema Changes

No persistent data schema changes. `UserStore` holds in-memory volatile state only:

* **Private signal: `_currentUser: WritableSignal<UserProfile | null>`** — initialised to `null`
* **Private signal: `_preferences: WritableSignal<UserPreferences>`** — initialised from `localStorage` or `DEFAULT_USER_PREFERENCES` (seeding logic belongs to FR-04; for this story, it initialises to `DEFAULT_USER_PREFERENCES`)

## 4. Component Contracts & Payloads

* **Interaction: Auth Layer → `UserStore`**
  * **Protocol:** In-process method call
  * **`setUser(profile: UserProfile): void`** — accepts a fully mapped `UserProfile` (produced by `UserProfileMapper.fromResponse`, FR-01); stores it in `_currentUser`
  * **`clearUser(): void`** — resets `_currentUser` to `null`; called on logout or 401 interception

* **Interaction: Preference-editing UI / FR-05 → `UserStore`**
  * **Protocol:** In-process method call
  * **`updatePreferences(patch: Partial<UserPreferences>): void`** — merges the patch into the existing `_preferences` value using object spread; the full merged `UserPreferences` object replaces the previous signal value

* **Interaction: Components / Guards → `UserStore` (read)**
  * **Protocol:** In-process signal read (synchronous, reactive)
  * **`currentUser: Signal<UserProfile | null>`** — computed from `_currentUser`
  * **`isAuthenticated: Signal<boolean>`** — `computed(() => this._currentUser() !== null)`
  * **`userRoles: Signal<string[]>`** — `computed(() => this._currentUser()?.roles ?? [])`
  * **`preferences: Signal<UserPreferences>`** — computed from `_preferences`

## 5. Updated Interaction Sequence

**Happy path — user logs in:**

1. Auth layer receives a successful login response and calls `UserProfileMapper.fromResponse(response)` (FR-01).
2. Auth layer calls `UserStore.setUser(mappedProfile)`.
3. `UserStore._currentUser` signal is updated to the new `UserProfile` value.
4. `isAuthenticated` computed signal transitions to `true`; `currentUser` and `userRoles` reflect the new values.
5. All components reading these signals re-evaluate synchronously via Angular's reactivity graph.

**Happy path — user logs out:**

1. Logout trigger (button, session expiry, 401 interceptor) calls `UserStore.clearUser()`.
2. `UserStore._currentUser` signal is set to `null`.
3. `isAuthenticated` transitions to `false`; `currentUser` returns `null`; `userRoles` returns `[]`.
4. Route guard (TASK002) detects `isAuthenticated() === false` and redirects to the login page.

**Happy path — preference update:**

1. A component or FR-05 calls `UserStore.updatePreferences({ theme: 'dark' })`.
2. `UserStore` merges the patch: `{ ...currentPrefs, theme: 'dark' }`.
3. `_preferences` signal is updated; `preferences` computed signal propagates to all subscribers.
4. FR-04 persistence `effect()` fires and writes the updated `UserPreferences` to `localStorage`.

**Unhappy path — `setUser` called while already authenticated:**

1. Auth layer calls `setUser()` again (e.g. token refresh).
2. `_currentUser` is replaced with the new profile; no error is thrown.
3. All derived computed signals re-evaluate to reflect the refreshed profile.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:**
  `UserStore` never stores tokens, passwords, or raw HTTP response objects. It accepts only the mapped `UserProfile` domain type. The store's private signals are inaccessible outside the class, preventing external mutation. `setUser()` does not accept `null` — only `clearUser()` can remove the authenticated user, ensuring explicit logout semantics.

* **Scale & Performance:**
  `isAuthenticated` and `userRoles` are `computed()` signals; Angular's reactivity graph recalculates them only when `_currentUser` changes, not on every change-detection cycle. The singleton `providedIn: 'root'` scope guarantees a single in-memory instance across all lazy-loaded feature areas of both `admin` and `operator` SPAs.
