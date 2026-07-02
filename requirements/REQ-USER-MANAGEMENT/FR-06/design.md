# System Design: FR-06 - Reset Password Flow

## 1. Architectural Overview

This story wires up the reset-password row action introduced by FR-02 (never reachable for the
acting admin's own row). Clicking it opens the same generic `ConfirmDialogComponent` introduced in
FR-05 — reused here verbatim, not reimplemented — warning that a new temporary password will be
issued, the user will be forced to change it at next login, and their existing sessions will be
revoked. Only on explicit confirmation is the reset-password endpoint called; on success, the
returned one-time temporary password is handed off to the same `TemporaryPasswordDialogComponent`
(FR-07) that FR-03's create flow uses, so both flows share one reveal implementation.

## 2. Impacted Components

* **`UsersListComponent` (Admin — from FR-02, modified):** Row-actions column's reset-password
  control gains its click handler. Opens `ConfirmDialogComponent` (from FR-05) before calling
  `ManagedUserStore.resetPassword(id)`. On success, opens `TemporaryPasswordDialogComponent` (FR-07)
  with the returned temporary password. Tracks a per-row busy signal so the control shows a busy
  state and cannot be double-clicked mid-request.
* **`ConfirmDialogComponent` (Shared Library — from FR-05, consumed not modified):** Opened with
  reset-password-specific `ConfirmDialogData` copy (new temporary password, forced change at next
  login, session revocation). Same component, same input contract as FR-05's deactivate
  confirmation — only the `ConfirmDialogData` payload content differs between the two call sites.
* **`ManagedUserStore` (Shared Library — from FR-01):** Consumed via `resetPassword(id)`.
* **`TemporaryPasswordDialogComponent` (Shared Library — from FR-07, consumed not modified):**
  Opened via `MatDialog` with `TemporaryPasswordDialogData = { temporaryPassword: string }` — the
  identical input contract FR-03 uses for its own reveal call site.
* **`NotificationService` (Shared Library):** Consumed for the error-notification path on failure;
  no reveal dialog opens when the reset call fails.

## 3. Abstract Data Schema Changes

None new. This story invokes FR-01's existing `resetPassword` store method, which already returns
the `UserCreationResult` type defined in FR-01; no new persisted entities or attributes are
introduced.

## 4. Component Contracts & Payloads

* **Interaction: `UsersListComponent` -> `MatDialog` -> `ConfirmDialogComponent`**
  * **Protocol:** In-process (Angular Material dialog service)
  * **Payload Changes:** `ConfirmDialogData = { title: string; message: string; confirmLabel:
    string; cancelLabel: string; danger?: boolean }` (identical shape to FR-05's usage) — `message`
    for this call site states that a new temporary password will be issued, the user must change it
    at next login, and existing sessions will be revoked; `danger: true`. `afterClosed()` resolves
    `true` on confirm, `false`/`undefined` on cancel or dismiss.

* **Interaction: `UsersListComponent` -> `ManagedUserStore.resetPassword(id)`**
  * **Protocol:** In-process function call wrapping HTTP `POST /api/auth/users/{id}/reset-password`
  * **Payload Changes:** No request body. Only invoked after `ConfirmDialogComponent.afterClosed()`
    resolves `true`. Success payload: `UserCreationResult = { user: ManagedUser, temporaryPassword:
    string }` — `user.mustChangePassword` is now `true`; the store's internal list is patched
    accordingly per FR-01 (roles/status columns are unaffected, consistent with this story's scope).

* **Interaction: `UsersListComponent` -> `MatDialog` -> `TemporaryPasswordDialogComponent`**
  * **Protocol:** In-process (Angular Material dialog service)
  * **Payload Changes:** Opened with `TemporaryPasswordDialogData = { temporaryPassword: string }`
    populated from the resolved `UserCreationResult.temporaryPassword` — the same input contract
    FR-03 uses, confirming both flows share one reveal component and one payload shape.

* **Interaction: `UsersListComponent` -> `NotificationService`**
  * **Protocol:** In-process function call
  * **Payload Changes:** On failure, `ApiErrorParser.parse(err)` ->
    `ErrorMessageResolver.resolve(apiError)` -> `NotificationService.error(message)`; no reveal
    dialog is opened in this path.

## 5. Updated Interaction Sequence

1. Admin clicks the reset-password action on a non-own-account row in `UsersListComponent`.
2. `MatDialog` opens `ConfirmDialogComponent` with reset-password-specific copy; no API call has been
   made yet.
3. **Declined/dismissed:** `afterClosed()` resolves `false`/`undefined` -> no API call is made; no
   reveal dialog appears.
4. **Confirmed:** `afterClosed()` resolves `true` -> `UsersListComponent` sets the row's busy signal
   and calls `ManagedUserStore.resetPassword(row.id)`.
   - **Success:** the store's internal list reflects `mustChangePassword: true` for that user;
     `UsersListComponent` opens `TemporaryPasswordDialogComponent` (FR-07) with the returned
     `temporaryPassword`; busy signal clears.
   - **Failure:** `NotificationService.error(...)` shows the resolved message; no reveal dialog
     opens; busy signal clears.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** This action is never reachable for the acting admin's own row (enforced
  upstream by FR-02's self-lockout gating). The confirmation copy explicitly names both session
  revocation and the forced credential change, per this story's NFR. The returned plaintext
  `temporaryPassword` is passed directly from the resolved `UserCreationResult` into
  `TemporaryPasswordDialogComponent`'s input — it is never assigned to any `UsersListComponent`
  field, logged, or persisted; only the reveal dialog (FR-07) briefly holds it in memory for the
  duration of that dialog's lifecycle.
* **Scale & Performance:** Single API call on confirmation; the row's action control shows a busy
  state while the request is in flight to prevent duplicate resets from rapid re-clicks.
