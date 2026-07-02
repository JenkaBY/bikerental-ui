# System Design: FR-05 - Activate / Deactivate Flow

## 1. Architectural Overview

This story wires up the single activate/deactivate toggle rendered per-row by FR-02 (never reachable
for the acting admin's own row). Its behavior branches on the row's current status: deactivating an
`ACTIVE` row requires an explicit confirmation step (since it revokes sessions and is
hard-to-reverse-in-the-moment for the affected user), while activating a `DISABLED` row calls the
generic update immediately with no confirmation. This story introduces the first consumer of a new,
generically reusable `ConfirmDialogComponent` in the Shared Library — there is no existing shared
confirm dialog in this codebase today, and FR-06 (reset password) needs the identical
confirm-before-destructive-action pattern, so a single reusable component is introduced here and
reused verbatim by FR-06 rather than each story inventing its own confirm dialog.

## 2. Impacted Components

* **`ConfirmDialogComponent` (Shared Library, new component —
  `projects/shared/src/shared/components/confirm-dialog/confirm-dialog.component.ts`):** Generic,
  reusable modal. Receives `ConfirmDialogData` via `MAT_DIALOG_DATA` (title, message/body copy,
  confirm-button label, cancel-button label, optional "danger" styling flag). Renders the message,
  a Cancel action (closes with `false`), and a Confirm action (closes with `true`). Carries no
  business logic of its own — the caller performs the actual mutation after `afterClosed()` resolves
  `true`. This is the same component FR-06 (reset password) reuses for its own confirmation step.
* **`UsersListComponent` (Admin — from FR-02, modified):** Row-actions column's activate/deactivate
  control gains its click handler. On an `ACTIVE` row, opens `ConfirmDialogComponent` before calling
  `ManagedUserStore.deactivate(id)`. On a `DISABLED` row, calls `ManagedUserStore.update(id, {
  status: 'ACTIVE' })` directly with no confirmation. Tracks a per-row busy signal so the toggle
  shows a busy state and cannot be double-clicked mid-request.
* **`ManagedUserStore` (Shared Library — from FR-01):** Consumed via `deactivate(id)` (dedicated
  endpoint) and `update(id, write)` (generic endpoint, reused for the activate direction).
* **`NotificationService` (Shared Library):** Consumed for the error-notification path on either
  direction's failure.

## 3. Abstract Data Schema Changes

None new. This story invokes FR-01's existing `deactivate` and `update` store methods against the
existing `ManagedUser`/`ManagedUserUpdateWrite` types; no new persisted entities or attributes are
introduced.

## 4. Component Contracts & Payloads

* **Interaction: `UsersListComponent` -> `MatDialog` -> `ConfirmDialogComponent`**
  * **Protocol:** In-process (Angular Material dialog service)
  * **Payload Changes:** `ConfirmDialogData = { title: string; message: string; confirmLabel:
    string; cancelLabel: string; danger?: boolean }`. For the deactivate flow, `message` explicitly
    states the account will be disabled and its active sessions revoked (per this story's NFR);
    `danger: true` selects the warning/destructive visual treatment. `afterClosed()` resolves `true`
    on confirm, `false`/`undefined` on cancel or dismiss (e.g. backdrop click, Escape key).

* **Interaction: `UsersListComponent` -> `ManagedUserStore.deactivate(id)`**
  * **Protocol:** In-process function call wrapping HTTP `POST /api/auth/users/{id}/deactivate`
  * **Payload Changes:** No request body. Only invoked after `ConfirmDialogComponent.afterClosed()`
    resolves `true`. Success payload: updated `ManagedUser` with `status: 'DISABLED'`, already
    reflected in the store's internal list per FR-01.

* **Interaction: `UsersListComponent` -> `ManagedUserStore.update(id, { status: 'ACTIVE' })`**
  * **Protocol:** In-process function call wrapping HTTP `PUT /api/auth/users/{id}`
  * **Payload Changes:** `write: ManagedUserUpdateWrite = { status: 'ACTIVE' }` — `displayName` and
    `roles` omitted (partial-update semantics leave them unchanged server-side). Invoked immediately
    on click with no preceding confirm dialog.

* **Interaction: `UsersListComponent` -> `NotificationService`**
  * **Protocol:** In-process function call
  * **Payload Changes:** On failure of either direction, `ApiErrorParser.parse(err)` ->
    `ErrorMessageResolver.resolve(apiError)` -> `NotificationService.error(message)`; the row's
    status/toggle state is left unchanged (no optimistic update was applied).

## 5. Updated Interaction Sequence

1. Admin clicks the activate/deactivate toggle on a non-own-account row in `UsersListComponent`.
2. `UsersListComponent` sets that row's busy signal to `true` and branches on `row.status`.
3. **Deactivate branch (`row.status === 'ACTIVE'`):**
   a. `MatDialog` opens `ConfirmDialogComponent` with deactivate-specific copy (disables account,
      revokes sessions); no API call has been made yet.
   b. **Confirmed:** `afterClosed()` resolves `true` -> `UsersListComponent` calls
      `ManagedUserStore.deactivate(row.id)`.
      - **Success:** row's status updates to `DISABLED` (store list already patched per FR-01); the
        toggle icon flips to the "activate" state; busy signal clears.
      - **Failure:** `NotificationService.error(...)` shows the resolved message; row status remains
        `ACTIVE`; busy signal clears.
   c. **Declined/dismissed:** `afterClosed()` resolves `false`/`undefined` -> no API call is made;
      row status remains `ACTIVE`; busy signal clears immediately.
4. **Activate branch (`row.status === 'DISABLED'`):** `UsersListComponent` calls
   `ManagedUserStore.update(row.id, { status: 'ACTIVE' })` immediately, no confirmation dialog shown.
   - **Success:** row's status updates to `ACTIVE`; toggle icon flips to the "deactivate" state; busy
     signal clears.
   - **Failure:** `NotificationService.error(...)` shows the resolved message; row status remains
     `DISABLED`; busy signal clears.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** This action is never reachable for the acting admin's own row (enforced
  upstream by FR-02's self-lockout gating). The deactivate confirmation copy explicitly names session
  revocation so the admin understands the consequence before committing, per this story's NFR.
* **Scale & Performance:** Single API call per action; the toggle exposes a per-row busy signal
  (keyed by user `id`, following the same `Record<id, boolean>` pattern already used by
  `TariffListComponent.toggling`) to prevent duplicate in-flight requests from rapid re-clicks.
