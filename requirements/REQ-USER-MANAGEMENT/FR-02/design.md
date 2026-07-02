# System Design: FR-02 - Users List View & Self-Lockout Row Gating

## 1. Architectural Overview

This story replaces the existing placeholder component at the admin `/admin/users` route with a
full list view backed by the `ManagedUserStore` introduced in FR-01. The new smart component loads
the complete user list once on navigation, renders it as a flat, unpaginated table, and applies a
UI-level self-lockout rule that disables/hides row actions for the row matching the currently
authenticated admin's own account. This story establishes the row-action surface (edit trigger,
reset-password trigger, activate/deactivate trigger) that FR-03 through FR-06 wire up — this FR
itself only defines the buttons/icons and their enabled state; the dialogs and API calls they
trigger are out of scope here except for the create-user entry point trigger, which is also
introduced here as the button that opens FR-03's dialog.

## 2. Impacted Components

* **`UserPlaceholderComponent` (Admin — `projects/admin/src/app/users/user-placeholder.component.ts`):**
  Removed/replaced by the new list component below; the existing route registration and sidebar nav
  item (`manage_accounts` icon, "Users" label) are repointed to it instead of being newly created.
* **`UsersListComponent` (Admin, new component — `projects/admin/src/app/users/users-list.component.ts`):**
  Smart component. Reads `ManagedUserStore.users()` and `loading()`; reads the authenticated admin's
  own `id` from the existing `UserStore.currentUser()`; renders the table with columns username,
  email, display name, roles (chips), status (badge), last login, row-actions; renders the "New
  User" action button that opens FR-03's create dialog; computes per-row "is own account" and
  disables/hides row actions accordingly; triggers `ManagedUserStore.load()` on init and again after
  any dialog closes with a truthy result.
* **`ManagedUserStore` (Shared Library — from FR-01):** Consumed read-only in this story via
  `users()` and `loading()`; no new methods required here.
* **`UserStore` (Shared Library — existing session store):** Consumed read-only via
  `currentUser()` to obtain the acting admin's own `id` for the self-lockout comparison.
* **`Role`, `ROLE_LABELS` (Shared Library — from FR-01):** Consumed to render the role chips'
  display labels.

## 3. Abstract Data Schema Changes

None. This story is UI-only and introduces no new persisted entities or attributes; it consumes the
`ManagedUser` read model and `Role`/`ROLE_LABELS` exactly as defined in FR-01.

## 4. Component Contracts & Payloads

* **Interaction: `UsersListComponent` -> `ManagedUserStore`**
  * **Protocol:** In-process signal read / method call
  * **Payload Changes:** `load(): Observable<void>` invoked on `ngOnInit` and after any child dialog
    close signal; `users(): ManagedUser[]` and `loading(): boolean` read as computed signals for
    rendering.

* **Interaction: `UsersListComponent` -> `UserStore`**
  * **Protocol:** In-process signal read
  * **Payload Changes:** `currentUser(): UserProfile | null` read once per render pass; the row
    "is own account" predicate is `row.id === currentUser()?.id`.

* **Interaction: `UsersListComponent` -> `MatDialog` -> `UserCreateDialogComponent` (FR-03)**
  * **Protocol:** In-process (Angular Material dialog service)
  * **Payload Changes:** Opened with no input data; `afterClosed()` result of `true` triggers
    `ManagedUserStore.load()` (list already includes the new record per FR-01 step 2, but a fresh
    `load()` is a safe no-op refresh consistent with the existing admin CRUD pattern — see FR-03 for
    the exact refresh contract used).

* **Interaction: `UsersListComponent` -> Error-Handling Toolkit**
  * **Protocol:** In-process function calls
  * **Payload Changes:** On `load()` failure, `ApiErrorParser.parse(err)` -> `ErrorMessageResolver.resolve(apiError)`
    -> `NotificationService.error(message)`; the table renders its empty/error state rather than
    stale data.

## 5. Updated Interaction Sequence

1. Admin Router activates `/admin/users`, resolving to `UsersListComponent` (registered in
   `projects/admin/src/app/app.routes.ts` in place of `UserPlaceholderComponent`).
2. `UsersListComponent.ngOnInit()` calls `ManagedUserStore.load()`.
3. `ManagedUserStore` sets `loading()` to `true`, calls the backend, maps responses via
   `ManagedUserMapper.fromResponse`, and sets its internal list signal; `loading()` returns to
   `false`.
4. `UsersListComponent` renders one row per `ManagedUser`: username, email, display name, a chip per
   entry in `roles` (labeled via `ROLE_LABELS`), a status badge (`ACTIVE` vs `DISABLED` styling),
   and last-login formatted via the existing date utility, or the literal "Never" when
   `lastLoginAt` is `undefined`.
5. For each row, `UsersListComponent` compares `row.id` to `UserStore.currentUser()?.id`; when equal,
   the edit, reset-password, and activate/deactivate controls for that row are rendered
   disabled (or omitted, per final visual design) — this is a rendering-time gate, not a route
   guard.
5a. Independently, `UsersListComponent` also compares `row.username` to the hardcoded bootstrap
   super-user username `'admin'`; when equal, the same three controls are rendered disabled
   regardless of who is viewing the screen, with a tooltip stating the account is protected. A row
   is locked when either the self-lockout predicate or the bootstrap-admin predicate is true
   (`isRowLocked(row) = isOwnAccount(row) || isBootstrapAdmin(row)`) — this is also a rendering-time
   gate, not a route guard; the backend remains the sole authority.
6. The activate/deactivate control's icon/label reflects `row.status`: `ACTIVE` rows show a
   "deactivate" affordance, `DISABLED` rows show an "activate" affordance (behavior wired in FR-05).
7. Clicking "New User" opens `UserCreateDialogComponent` (FR-03) via `MatDialog`; on `afterClosed()`
   result `true`, `UsersListComponent` calls `ManagedUserStore.load()` again.
8. **Unhappy path:** if step 3's backend call fails, `ManagedUserStore.load()` propagates the error;
   `UsersListComponent` catches it, resolves it through `ApiErrorParser`/`ErrorMessageResolver`,
   surfaces it via `NotificationService.error(...)`, and renders the table's empty/error state
   (no partial or stale rows shown).

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The self-lockout and bootstrap-admin-protection gating implemented here are
  explicitly UI conveniences, not security boundaries — the backend remains the sole authority over
  what may be done to any account. The bootstrap-admin username (`'admin'`) is hardcoded client-side
  rather than sourced from a backend flag, since `UserResponse` carries no "protected"/"system"
  attribute; if the backend later exposes such a flag, this predicate should switch to it. No new
  guard is introduced; the existing `adminGuard` on the `/admin` route tree already restricts this
  screen to authenticated admins.
* **Scale & Performance:** Single unpaginated load of at most ~20 records; no debounce, search, or
  virtualization. `ManagedUserStore.load()` is safe to call repeatedly (idempotent full replace),
  so re-triggering it after every child dialog close is an acceptable, simple refresh strategy at
  this data scale.
