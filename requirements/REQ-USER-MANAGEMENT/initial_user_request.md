# Initial User Request — User Management

## Original Request

Add a new admin feature: "User management" — CRUD-style administration of application user
accounts (admin and operator staff logins) from the existing Admin SPA.

### Backend API surface (`/api/auth/users`, wrapped by the generated `UsersService`)

- `GET /api/auth/users` — list all users (admin only). Returns `UserResponse[]`. No pagination —
  total users will never exceed ~20.
- `GET /api/auth/users/{id}` — get one user (admin only). Returns `UserResponse`.
- `POST /api/auth/users` — create a user (admin only). Body:
  `CreateUserRequest { username: string; email: string; displayName?: string; roles: ('ADMIN'|'OPERATOR')[]; password?: string }`.
  `password` is optional — if provided it is used as-is; if omitted the backend generates one.
  Returns `UserCreationResponse { user: UserResponse; temporaryPassword: string }` — the plaintext
  password is only ever present in this one response and must be shown to the admin once (with a
  copy action) since it cannot be retrieved again afterward.
- `PUT /api/auth/users/{id}` — update a user (admin only). Body:
  `UpdateUserRequest { displayName?: string; roles?: ('ADMIN'|'OPERATOR')[]; status?: 'ACTIVE'|'DISABLED' }`
  — only these three fields are updatable; username/email are immutable and not sent. Omitted
  fields are left unchanged (partial-update semantics); an empty roles array is ignored (does not
  clear roles). Returns `UserResponse`.
- `POST /api/auth/users/{id}/reset-password` — admin-triggered password reset (no body). Sets a
  new temporary password, forces the user to change it at next login, and revokes their existing
  sessions. Returns `UserCreationResponse` (same one-time-reveal semantics as create).
- `POST /api/auth/users/{id}/deactivate` — disables the account and revokes its sessions (admin
  only, no body). Returns `UserResponse`. Accounts are never deleted, only deactivated. There is
  no dedicated "activate" endpoint — reactivating a disabled user is done via the generic `PUT`
  with `{ status: 'ACTIVE' }`.
- `UserResponse { id, username, email, displayName, status: 'ACTIVE'|'DISABLED', mustChangePassword: boolean, roles: ('ADMIN'|'OPERATOR')[], lastLoginAt }`.
- Roles are exactly two: `ADMIN`, `OPERATOR`. A user must always have at least one role (create
  requires ≥1; the UI should not allow saving zero roles on edit either, even though the backend
  would just ignore an empty array rather than reject it).

### Decisions made with the end user (binding — not to be re-litigated)

1. **Users list page** at the existing `/admin/users` route (currently a placeholder component
   `user-placeholder.component.ts` with a "Users" nav item already in the admin sidebar, icon
   `manage_accounts`). Single flat table, no pagination, no search/filter (dataset is small by
   design). Columns: username, email, display name, roles (as chips), status (badge), last login,
   and a row-actions column.
2. **Row actions**: edit (opens edit dialog), reset password (opens a confirm dialog, then calls
   reset-password and shows the one-time temporary-password reveal), and a single
   activate/deactivate toggle icon whose icon/behavior flips based on the row's current status —
   deactivating calls the dedicated deactivate endpoint (behind a confirm dialog); activating
   calls the generic update with `{ status: 'ACTIVE' }` (no confirm dialog needed for activation,
   only for deactivation).
3. **Confirm dialog required** before: deactivate, and reset-password (both revoke the user's
   sessions / force a new credential). Not required for: create, edit-save, activate.
4. **Create user dialog**: fields username, email, display name (optional), roles
   (multi-select/checkboxes, at least one required), and an optional "set password" field (left
   blank → backend auto-generates and returns it in the one-time reveal; filled → sent as-is and
   used directly, no reveal needed in that case since the admin already knows it — though showing
   a lightweight success confirmation either way is fine). On success, refreshes the list.
5. **Edit user dialog**: only displayName, roles, status are editable (matches the `PUT` contract
   exactly) — username and email are shown read-only for context but cannot be changed since the
   backend doesn't accept them.
6. **Self-lockout protection (UI-level, not backend)**: the currently authenticated admin cannot
   edit, deactivate, reset their own password, or change their own role/status through this Users
   management screen — all row actions must be disabled/hidden for the row matching the logged-in
   admin's own account. "Own account" is determined by comparing the row's id against the
   authenticated user's id (available via the existing session `UserStore`/`UserProfile`).
7. **Temporary password reveal**: a small dialog shown once after create (when no password was
   supplied) and after reset-password, displaying the plaintext temporary password with a
   copy-to-clipboard action and a clear one-time-only warning. It is never persisted or shown again
   after the dialog closes.
8. This is an **admin-only** feature (existing `adminGuard` already protects the `/admin` route
   tree — no new guard logic needed, just a constraint to note).
9. Follows the project's three-layer data pipeline (`core/api/generated` → `core/mappers` →
   `core/models` → components) and the enterprise Angular patterns already documented in
   `AGENTS.md`/`CLAUDE.md` (signal store, OnPush, standalone components, `$localize` for all copy,
   API error handling via `NotificationService`/`ApiErrorParser`/`applyServerErrors` where relevant,
   e.g. duplicate username/email on create).
10. **No tests** — the project is in MVP phase and `AGENTS.md` explicitly forbids writing or
    updating any test files (unit/integration/component/e2e) right now.

### Assumed defaults (confirmed with end user)

- Email field uses standard email-format client-side validation (consistent with the existing
  Customer create dialog).
- "Last login" renders as an em-dash / "Never" when the value is null.
- The optional "set password" field on create only requires non-empty-if-filled — no client-side
  password-strength/complexity rule, since the backend accepts a supplied password as-is.

### Naming collision to flag for the architect

This codebase already has `projects/shared/src/core/state/user.store.ts` exporting `UserStore`
(the authenticated session's own profile, used for auth/nav) and
`projects/shared/src/core/models/user-profile.model.ts` exporting `UserProfile`. The existing
convention for a *list* feature store in this repo is `<entity>-list.store.ts` (see
`customer-list.store.ts` → `CustomerListStore` alongside `customer.store.ts` → `CustomerStore`), so
the new admin-managed-users store introduced by this feature should follow that same pattern and
avoid the bare name `UserStore` / `user.store.ts`, since it is already taken by the session store.

## Scope

Split into 7 Functional Requirements (`FR-01`..`FR-07`) under
`requirements/REQ-USER-MANAGEMENT/`:

- FR-01 — User Domain Model, Mapper & Store
- FR-02 — Users List View & Self-Lockout Row Gating
- FR-03 — Create User Dialog
- FR-04 — Edit User Dialog
- FR-05 — Activate / Deactivate Flow
- FR-06 — Reset Password Flow
- FR-07 — One-Time Temporary Password Reveal Dialog

Out of scope for the whole feature: account deletion (accounts are never deleted, only
deactivated), self-service profile editing by non-admins, password-strength policy enforcement,
audit-log UI, and any test-file changes (MVP rule).
