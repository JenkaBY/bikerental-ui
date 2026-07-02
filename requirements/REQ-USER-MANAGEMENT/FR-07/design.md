# System Design: FR-07 - One-Time Temporary Password Reveal Dialog

## 1. Architectural Overview

This story implements the shared reveal dialog that both FR-03 (create with no supplied password)
and FR-06 (reset password) open identically once they receive a `UserCreationResult` from
`ManagedUserStore`. It is a single, generic, presentation-only component in the Shared Library —
`TemporaryPasswordDialogComponent` — with no knowledge of which flow triggered it and no further
side effects beyond copy-to-clipboard and close. Its defining architectural constraint is
discard-on-close: the plaintext password it displays exists only as the dialog's own
`MAT_DIALOG_DATA` input for the lifetime of the dialog, and is never written anywhere else in the
app's state, so once the dialog is dismissed no other screen can ever redisplay the same value.

## 2. Impacted Components

* **`TemporaryPasswordDialogComponent` (Shared Library, new component —
  `projects/shared/src/shared/components/temporary-password-dialog/temporary-password-dialog.component.ts`):**
  Modal. Receives `TemporaryPasswordDialogData` via `MAT_DIALOG_DATA`. Renders the
  `temporaryPassword` in a masked (`type="password"`), read-only field by default — a "show
  password" toggle button switches the field's type to `text` (and back) so the admin must take a
  deliberate action to see the plaintext value, reducing accidental exposure in screen shares or
  screenshots — plus a copy-to-clipboard action button with a transient visible success indicator, a
  one-time-only warning message, and a single "Done" close action. Carries no injected store or
  service beyond the clipboard write and `MatDialogRef` — it performs no API calls of any kind.
* **`UserCreateDialogComponent` (Admin — from FR-03, consumer only):** Opens this dialog with
  `TemporaryPasswordDialogData = { temporaryPassword: string }` when create succeeds with no
  admin-supplied password.
* **`UsersListComponent` (Admin — from FR-06, consumer only):** Opens this dialog with the same
  `TemporaryPasswordDialogData` shape when a reset-password action succeeds.

## 3. Abstract Data Schema Changes

None. This story introduces no persisted entity — its only data shape is the transient dialog input
`TemporaryPasswordDialogData = { temporaryPassword: string }`, which is not part of `core/models/`
since it is a component-input contract, not a domain model; it is a thin pass-through of the
`temporaryPassword` field already defined on FR-01's `UserCreationResult`.

## 4. Component Contracts & Payloads

* **Interaction: `UserCreateDialogComponent` (FR-03) / `UsersListComponent` (FR-06) -> `MatDialog`
  -> `TemporaryPasswordDialogComponent`**
  * **Protocol:** In-process (Angular Material dialog service)
  * **Payload Changes:** `MAT_DIALOG_DATA = TemporaryPasswordDialogData = { temporaryPassword:
    string }` — identical shape and field name at both call sites, so the dialog's internal template
    and logic have no branching on "which flow opened me." `afterClosed()` resolves with no
    meaningful value (`void`/`undefined`); neither caller inspects the result — both callers have
    already completed their own refresh/notification steps before this dialog opens.
  * **Dismissal contract:** the only way to close the dialog is its own explicit "Done" action
    (`disableClose: true` set by the opening call, or equivalent enforced-close configuration) —
    backdrop click and Escape are not accepted dismissal paths, per the "closing is the only way to
    dismiss it" rule.

* **Interaction: `TemporaryPasswordDialogComponent` -> Clipboard API**
  * **Protocol:** In-process browser API call (`navigator.clipboard.writeText`)
  * **Payload Changes:** Writes `data.temporaryPassword` verbatim to the system clipboard; on
    success, a local signal flips to show a transient "Copied" indicator (auto-reverting after a
    short delay, consistent with this repo's existing snackbar/indicator timing conventions); on
    failure (e.g. clipboard permission denied), falls back to a visible error indicator without
    throwing — the password remains visible and selectable regardless.

## 5. Updated Interaction Sequence

1. A caller (`UserCreateDialogComponent` per FR-03, or `UsersListComponent` per FR-06) has already
   received a successful `UserCreationResult` and opens `TemporaryPasswordDialogComponent` with
   `{ temporaryPassword: result.temporaryPassword }`.
2. `TemporaryPasswordDialogComponent` renders the password in a masked field by default, alongside
   the one-time-only warning copy, a "show password" toggle, and a copy action.
2a. **Reveal path:** admin clicks the "show password" toggle; a local `showPassword` signal flips
   and the field's `type` switches from `password` to `text`, revealing the plaintext value as
   selectable text; clicking the toggle again switches it back to masked. This is purely a local
   rendering toggle — it never touches the clipboard or any external state.
3. **Copy path:** admin clicks the copy action (independent of the current masked/revealed state);
   the dialog writes `temporaryPassword` to the clipboard and shows a brief visible success
   indicator; the dialog remains open and no other state changes.
4. **Close path:** admin clicks "Done" (the dialog's only dismissal action); `MatDialogRef.close()`
   is called; the dialog's own component instance (and therefore its `MAT_DIALOG_DATA` reference to
   the plaintext value) is destroyed by Angular Material's dialog teardown; no signal, store, or
   `localStorage`/`sessionStorage` entry retains the value afterward.
5. Because neither `UserCreateDialogComponent` nor `UsersListComponent` stores the
   `temporaryPassword` field anywhere beyond passing it into this dialog's input, and
   `ManagedUserStore` never retained it in the first place (per FR-01), the value becomes
   unreachable anywhere in the app's state the instant this dialog closes — reopening any other
   dialog (including a subsequent create or reset for a different user) cannot show a stale or
   cached copy of a previous value.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** This is the single terminal point for the plaintext temporary password's
  lifetime in the frontend. It is never logged, never written to `localStorage`/`sessionStorage`,
  and never retained in any signal or field outside this dialog's own instance data — enforced by
  construction, since the component holds the value only as its injected `MAT_DIALOG_DATA` and never
  copies it into a longer-lived store. Clipboard writes are the only external side effect, and they
  are user-initiated per click.
* **Scale & Performance:** Purely a display dialog with no I/O beyond the clipboard write — no
  network calls, no polling, no persistence layer involvement.
