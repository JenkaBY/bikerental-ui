# System Design: FR-03 - Create User Dialog

## 1. Architectural Overview

This story adds the create-user entry point wired up in FR-02's "New User" button: a modal dialog
component that collects username, email, optional display name, at least one role, and an optional
password, then delegates persistence to `ManagedUserStore.create()` (FR-01). On success, the dialog
branches: if the admin left the password blank, it hands the resulting `UserCreationResult` off to
the shared `TemporaryPasswordDialogComponent` (FR-07) for the one-time reveal; if the admin supplied
a password, it shows a lightweight success notification instead. Either way it closes with a signal
that tells FR-02's list to refresh. Role selection is driven by FR-01's canonical `Role`/
`ASSIGNABLE_ROLES` constant so the checkbox set is never hand-duplicated here.

## 2. Impacted Components

* **`UserCreateDialogComponent` (Admin, new component —
  `projects/admin/src/app/users/user-create-dialog.component.ts`):** Modal form. Renders a reactive
  form with username, email, displayName, roles (checkboxes generated from `ASSIGNABLE_ROLES`), and
  password fields. Disables Confirm while the form is invalid. Calls `ManagedUserStore.create()` on
  confirm. Branches on whether a password was supplied to either open
  `TemporaryPasswordDialogComponent` (FR-07) or show a success notification. Surfaces HTTP errors
  inline via the standard error-handling toolkit and keeps the dialog open on failure.
* **`ManagedUserStore` (Shared Library — from FR-01):** Consumed via `create(write)`; no new methods
  required.
* **`Role`, `ASSIGNABLE_ROLES`, `ROLE_LABELS` (Shared Library — from FR-01):** Consumed to render the
  role checkbox group — this dialog iterates `ASSIGNABLE_ROLES` to produce one checkbox per role,
  labeled via `ROLE_LABELS`, instead of hardcoding `'ADMIN'`/`'OPERATOR'` literals.
* **`TemporaryPasswordDialogComponent` (Shared Library — from FR-07, consumed not modified):**
  Opened via `MatDialog` with a `TemporaryPasswordDialogData` payload (`{ temporaryPassword: string }`)
  when the create succeeds with no admin-supplied password.
* **`NotificationService`, `ApiErrorParser`, `ErrorMessageResolver`, `applyServerErrors` (Shared
  Library — existing error-handling toolkit):** Consumed for both the success-without-reveal path
  and the inline error path.

## 3. Abstract Data Schema Changes

None new. This story populates and submits FR-01's `ManagedUserCreateWrite` write model; no new
persisted entities or attributes are introduced.

## 4. Component Contracts & Payloads

* **Interaction: `UsersListComponent` (FR-02) -> `MatDialog` -> `UserCreateDialogComponent`**
  * **Protocol:** In-process (Angular Material dialog service)
  * **Payload Changes:** Opened with no `MAT_DIALOG_DATA` input (create is always a blank form).
    `afterClosed()` resolves to `true` on any successful create (regardless of which post-success
    branch was taken) or `undefined`/`false` on cancel — matching this repo's existing dialog-close
    convention.

* **Interaction: `UserCreateDialogComponent` -> `ManagedUserStore.create(write)`**
  * **Protocol:** In-process function call wrapping HTTP `POST /api/auth/users`
  * **Payload Changes:** `write: ManagedUserCreateWrite = { username, email, displayName?, roles,
    password? }`. Request is sent with `SUPPRESS_ERROR_NOTIFICATION` (via `suppressErrorNotification()`)
    so the global error interceptor does not also toast — this dialog handles its own error display.
  * **Success payload:** `UserCreationResult = { user: ManagedUser, temporaryPassword: string }`.
    Note the backend always returns a `temporaryPassword` in `UserCreationResponse`; when the admin
    supplied their own password, this dialog treats that field as an echo of the confirmed value and
    intentionally does **not** forward it to the reveal dialog — it only opens the reveal when the
    admin's own submitted password field was empty at submit time (tracked as local dialog state,
    not derived from the response).
  * **Error payload:** `ApiError` (parsed via `ApiErrorParser.parse(err)`) — field errors (e.g.
    duplicate `username`/`email`) applied to the form via `applyServerErrors(form, apiError)`;
    unmatched messages shown via `NotificationService.error(...)`.

* **Interaction: `UserCreateDialogComponent` -> `MatDialog` -> `TemporaryPasswordDialogComponent`**
  * **Protocol:** In-process (Angular Material dialog service)
  * **Payload Changes:** Opened with `TemporaryPasswordDialogData = { temporaryPassword: string }`
    populated from `UserCreationResult.temporaryPassword`. Opened only after
    `UserCreateDialogComponent` itself has already closed with `true` (sequential, not nested,
    dialogs) so `UsersListComponent`'s refresh trigger fires immediately and independently of
    whether the admin dismisses the reveal promptly.

## 5. Updated Interaction Sequence

1. Admin clicks "New User" on `UsersListComponent` (FR-02); `MatDialog` opens
   `UserCreateDialogComponent` with an empty reactive form; Confirm is disabled (username empty,
   email empty, zero roles selected).
2. Admin fills username, email, optionally displayName, selects at least one role (checkboxes
   rendered from `ASSIGNABLE_ROLES`), and optionally a password. Confirm enables once username is
   non-empty, email is valid format, and at least one role checkbox is checked.
3. Admin clicks Confirm. `UserCreateDialogComponent` records locally whether the password field was
   left blank, then calls `ManagedUserStore.create(write)` with `SUPPRESS_ERROR_NOTIFICATION`; the
   Confirm button shows a busy state.
4. **Happy path — blank password:** on success, `UserCreateDialogComponent` closes itself with
   `true`, then opens `TemporaryPasswordDialogComponent` (FR-07) with the returned
   `temporaryPassword`. `UsersListComponent` observes the `true` result and calls
   `ManagedUserStore.load()`.
5. **Happy path — supplied password:** on success, `UserCreateDialogComponent` closes itself with
   `true` and calls `NotificationService.success(...)` with a lightweight confirmation message; no
   reveal dialog opens. `UsersListComponent` refreshes identically to step 4.
6. **Unhappy path — duplicate username/email:** the backend responds with a conflict; the interceptor
   is bypassed (`SUPPRESS_ERROR_NOTIFICATION`); `UserCreateDialogComponent` parses the error via
   `ApiErrorParser.parse(err)`, applies field errors via `applyServerErrors(form, apiError)` (e.g. a
   `server` error on the `username` or `email` control), shows any unmatched message via
   `NotificationService.error(...)`, re-enables Confirm, and keeps the dialog open for retry.
7. **Cancel path:** admin clicks Cancel at any point before Confirm resolves; dialog closes with
   `undefined`/`false`, no API call is made, `UsersListComponent` does not refresh.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The plaintext password (admin-supplied or backend-generated) is held only in
  the dialog's own reactive form control / the resolved `UserCreationResult` value passed directly
  into `TemporaryPasswordDialogComponent`'s input — never logged, never assigned to a persisted
  signal, never round-tripped through `localStorage`. The create request itself always travels over
  the shared HTTPS/HTTP API boundary already governing this workspace; no new transport concern is
  introduced.
* **Scale & Performance:** Single API call per submit; Confirm shows a busy/loading state to prevent
  duplicate submits while in flight, and is re-enabled after any error for retry without reopening
  the dialog.
