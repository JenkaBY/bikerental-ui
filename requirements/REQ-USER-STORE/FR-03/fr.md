# User Story: FR-03 — Global UserStore Signal Service

## 1. Description

**As a** developer
**I want to** have a globally available `UserStore` signal service in the shared library
**So that** any component in the `admin` or `operator` app can reactively read the authenticated user's identity and know whether a user is logged in — without passing data through component hierarchies

## 2. Context & Business Rules

* **Trigger:** The application starts; a user completes the login flow and the auth layer calls `UserStore.setUser()`
* **Rules Enforced:**
  * `UserStore` must be declared with `providedIn: 'root'` so it is a singleton shared across the entire app
  * The store must hold two private writable signals: one for `UserProfile | null` (identity) and one for `UserPreferences` (settings)
  * **Identity signals exposed publicly (read-only):**
    * `currentUser: Signal<UserProfile | null>` — the full profile, or `null` when not authenticated
    * `isAuthenticated: Signal<boolean>` — `true` when `currentUser` is not `null`
    * `userRoles: Signal<string[]>` — shortcut computed from `currentUser?.roles ?? []`
  * **Preferences signal exposed publicly (read-only):**
    * `preferences: Signal<UserPreferences>`
  * **Mutation methods:**
    * `setUser(profile: UserProfile): void` — replaces the current user; must not accept `null` (use `clearUser()` for logout)
    * `clearUser(): void` — sets identity back to `null`; called on logout
    * `updatePreferences(patch: Partial<UserPreferences>): void` — merges the patch into existing preferences
  * Before `setUser()` is called, `isAuthenticated` must return `false` and `currentUser` must return `null`
  * After `clearUser()`, `isAuthenticated` must return `false`, `currentUser` must return `null`, and `userRoles` must return `[]`
  * `UserStore` must be exported from the shared library's `public-api.ts` barrel

## 3. Non-Functional Requirements (NFRs)

* **Performance:** All derived values (`isAuthenticated`, `userRoles`) must use `computed()` so Angular's reactivity graph avoids redundant recalculations
* **Security/Compliance:** No token or password data is stored in the `UserStore`; the store holds profile data only
* **Usability/Other:** The store must work in both `admin` and `operator` SPAs without any additional provider registration

## 4. Acceptance Criteria (BDD)

**Scenario 1: Initial state — unauthenticated**

* **Given** the application has just started and `setUser()` has never been called
* **When** a component reads the store signals
* **Then** `isAuthenticated()` returns `false`, `currentUser()` returns `null`, and `userRoles()` returns `[]`

**Scenario 2: Setting a user transitions the store to authenticated state**

* **Given** `isAuthenticated()` is `false`
* **When** `setUser({ id: '1', email: 'a@b.com', firstName: 'Ana', lastName: 'Doe', roles: ['ADMIN'] })` is called
* **Then** `isAuthenticated()` returns `true`, `currentUser()` returns the provided profile, and `userRoles()` returns `['ADMIN']`

**Scenario 3: clearUser resets identity to unauthenticated**

* **Given** a user is authenticated (scenario 2 state)
* **When** `clearUser()` is called
* **Then** `isAuthenticated()` returns `false`, `currentUser()` returns `null`, and `userRoles()` returns `[]`

**Scenario 4: updatePreferences merges patch without losing other fields**

* **Given** current preferences are `{ language: 'en-US', theme: 'system' }`
* **When** `updatePreferences({ theme: 'dark' })` is called
* **Then** `preferences()` returns `{ language: 'en-US', theme: 'dark' }`

**Scenario 5: Store is a singleton across the application**

* **Given** the `UserStore` is injected in both an admin component and an operator component
* **When** `setUser()` is called from one injection site
* **Then** the other injection site's `currentUser` signal reflects the same profile immediately

## 5. Out of Scope

* Token storage, JWT parsing, or HTTP interceptor logic (belongs to TASK002 AuthService)
* Route guards that use `isAuthenticated` (belongs to TASK002)
* Persistence of identity signals to `localStorage` (only preferences are persisted — see FR-04)
