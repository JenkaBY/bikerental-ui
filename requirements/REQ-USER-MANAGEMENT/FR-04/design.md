# System Design: FR-04 - Edit User Dialog

## 1. Architectural Overview

This story adds the edit entry point wired up from FR-02's per-row edit action (never reachable for
the acting admin's own row, per FR-02's self-lockout gating). The dialog pre-fills from the selected
`ManagedUser`, exposes only the three fields the backend's `PUT` contract accepts — `displayName`,
`roles`, `status` — and shows `username`/`email` read-only for context. It reuses the same
`ASSIGNABLE_ROLES`/`ROLE_LABELS` source as FR-03's create dialog for its role checkboxes, so both
dialogs render an identical, single-sourced role selector. No confirmation dialog is required for a
save — this is a direct, low-risk field update in the backend's own words.

## 2. Impacted Components

* **`UserEditDialogComponent` (Admin, new component —
  `projects/admin/src/app/users/user-edit-dialog.component.ts`):** Modal form. Receives
  `{ user: ManagedUser }` via `MAT_DIALOG_DATA`. Renders `username`/`email` as disabled/read-only
  fields alongside an editable `displayName` input, a `roles` checkbox group (from
  `ASSIGNABLE_ROLES`), and a `status` selector (`ACTIVE`/`DISABLED`). Disables Save when `roles`
  would be empty. Calls `ManagedUserStore.update(id, write)` on save. Surfaces HTTP errors inline;
  keeps dialog open on failure.
* **`ManagedUserStore` (Shared Library — from FR-01):** Consumed via `update(id, write)`.
* **`Role`, `ASSIGNABLE_ROLES`, `ROLE_LABELS` (Shared Library — from FR-01):** Consumed identically
  to FR-03 for the role checkbox group — same iteration source, same label map, so the two dialogs
  can never drift into offering different role sets.
* **`NotificationService`, `ApiErrorParser`, `ErrorMessageResolver`, `applyServerErrors` (Shared
  Library):** Consumed for the inline error path.

## 3. Abstract Data Schema Changes

None new. This story populates and submits FR-01's `ManagedUserUpdateWrite` write model, seeded from
an existing `ManagedUser` read model; no new persisted entities or attributes are introduced.

## 4. Component Contracts & Payloads

* **Interaction: `UsersListComponent` (FR-02) -> `MatDialog` -> `UserEditDialogComponent`**
  * **Protocol:** In-process (Angular Material dialog service)
  * **Payload Changes:** Opened with `MAT_DIALOG_DATA = { user: ManagedUser }` — the full row's
    current domain object, used both to pre-fill the form and to supply `user.id` for the update
    call. `afterClosed()` resolves to `true` on successful save or `undefined`/`false` on cancel.

* **Interaction: `UserEditDialogComponent` -> `ManagedUserStore.update(id, write)`**
  * **Protocol:** In-process function call wrapping HTTP `PUT /api/auth/users/{id}`
  * **Payload Changes:** `write: ManagedUserUpdateWrite = { displayName?, roles?, status? }` — built
    from the form's current values; `username`/`email` never appear on this type and are therefore
    structurally impossible to submit. Request sent with `SUPPRESS_ERROR_NOTIFICATION` so the dialog
    owns its own error display.
  * **Success payload:** Updated `ManagedUser`, already reflected in `ManagedUserStore`'s internal
    list per FR-01 step 3.
  * **Error payload:** `ApiError` parsed via `ApiErrorParser.parse(err)`; field errors applied via
    `applyServerErrors(form, apiError)`; unmatched messages via `NotificationService.error(...)`.

## 5. Updated Interaction Sequence

1. Admin clicks the edit action on a non-own-account row in `UsersListComponent` (FR-02); `MatDialog`
   opens `UserEditDialogComponent` with `{ user: ManagedUser }`.
2. `UserEditDialogComponent` pre-fills its form: `displayName` and `status` as editable controls
   seeded from `user.displayName`/`user.status`; `roles` checkboxes (from `ASSIGNABLE_ROLES`)
   pre-checked per `user.roles`; `username`/`email` rendered as disabled/read-only text showing
   `user.username`/`user.email`.
3. Admin edits `displayName`, toggles `roles` checkboxes, and/or changes `status`. Save is disabled
   whenever the resulting `roles` selection would be empty (client-side guard — the backend would
   silently ignore an empty array rather than reject it, but the UI never allows submitting that
   state).
4. Admin clicks Save. `UserEditDialogComponent` calls
   `ManagedUserStore.update(user.id, { displayName, roles, status })` with
   `SUPPRESS_ERROR_NOTIFICATION`; Save shows a busy state.
5. **Happy path:** on success, dialog closes with `true`; `UsersListComponent` observes the result
   and calls `ManagedUserStore.load()` (a safe refresh; the store's internal list is already patched
   per FR-01).
6. **Unhappy path:** on API error, `UserEditDialogComponent` parses the error via
   `ApiErrorParser.parse(err)`, applies field errors via `applyServerErrors(form, apiError)`, shows
   any unmatched message via `NotificationService.error(...)`, re-enables Save, and keeps the dialog
   open for retry.
7. **Cancel path:** admin clicks Cancel with unsaved changes; dialog closes with `undefined`/`false`,
   no API call is made, `UsersListComponent` does not refresh.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** This dialog is never reachable for the acting admin's own row (enforced
  upstream by FR-02's self-lockout gating, not by this dialog itself) — no additional guard logic is
  introduced here. `username`/`email` immutability is enforced at the type level
  (`ManagedUserUpdateWrite` has no such fields), not merely by disabling form controls, so there is
  no code path by which those fields could be sent even if the read-only styling were bypassed.
* **Scale & Performance:** Single API call per save; Save shows a busy state to prevent duplicate
  submits and is re-enabled after any error for retry without reopening the dialog.
