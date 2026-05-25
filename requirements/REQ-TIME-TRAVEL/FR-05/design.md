# System Design: FR-05 — Time Travel Dialog

## 1. Architectural Overview

This story introduces `TimeTravelDialogComponent`, the interactive mutation surface for the time-travel feature. The dialog is opened imperatively by `TimeTravelDisplayComponent` (FR-04) via `MatDialog.open()` and is closed either on a successful API response or on user cancellation. It has no route of its own and is not subject to any navigation guard — access is implicitly gated by the `@if (timeTravelEnabled)` guard that wraps its trigger (FR-04).

The dialog follows the established Admin CRUD pattern: it reads initial state from `TimeTravelStore`, delegates writes to `TimeTravelStore.setTime()` and `TimeTravelStore.resetTime()`, and closes with a truthy result on success. HTTP errors are handled entirely by the global `ErrorInterceptor`; the dialog does not render its own error messages and does not need to subscribe to an error stream.

---

## 2. Impacted Components

* **`TimeTravelDialogComponent` (New — `projects/shared/src/shared/components/time-travel-dialog/`):**
  Introduced as a new standalone dialog component. Responsibilities:
  * On open, read `TimeTravelStore.serverTime()` and pre-fill the datetime picker field with `serverTime()?.instant`; if `null`, fall back to the current browser time.
  * Render a single Angular Material datetime picker field bound to a reactive form control.
  * Render a **Save** button: disabled when the datetime field is empty or invalid; on click, calls `TimeTravelStore.setTime(selectedDate)`, subscribes to the Observable, and on success calls `MatDialogRef.close(true)`.
  * Render a **Reset** button: always enabled; on click, calls `TimeTravelStore.resetTime()`, subscribes to the Observable, and on success calls `MatDialogRef.close(true)`.
  * On backdrop click or Escape key, the Angular Material dialog closes naturally (no API call triggered).
  * Does not suppress or display HTTP errors — relies on the global `ErrorInterceptor` to surface them via `MatSnackBar`.
  * Button labels are sourced from `shared/constant/labels.ts` via `$localize` i18n constants.
  * Applies `ChangeDetectionStrategy.OnPush`.

* **`TimeTravelDisplayComponent` (Modified — FR-04):**
  The existing display component opens this dialog via `MatDialog.open(TimeTravelDialogComponent)`. No structural changes to the display component beyond what was established in FR-04; this story merely defines the target component that is opened.

* **`shared/constant/labels.ts` (Shared i18n Label Constants):**
  Must be extended with two new `$localize`-tagged constants: one for the **Save** button label and one for the **Reset** button label used in the dialog. Existing label constants are unchanged.

* **`public-api.ts` (Shared Library Public API Barrel):**
  Must export `TimeTravelDialogComponent` so the component can be referenced in `MatDialog.open()` calls across both Admin and Operator apps without direct path imports.

---

## 3. Abstract Data Schema Changes

No new domain entities. The dialog operates on the `ServerTime` domain model (FR-02) read from the `TimeTravelStore` signal (FR-03). The outgoing mutation uses the `Date` type internally; the mapper layer (FR-02) converts it to the API wire format.

* **Form State (in-memory only, not persisted):**
  * `selectedDatetime` (Date | null) — the current value of the datetime picker field. Initially set from `serverTime()?.instant` or browser time. Cleared by the user action or field validation. Not propagated anywhere until the Save button is pressed.

---

## 4. Component Contracts & Payloads

* **Interaction: `TimeTravelDisplayComponent` → `TimeTravelDialogComponent`**
  * **Protocol:** `MatDialog.open()` (imperative dialog instantiation)
  * **Payload Changes:** No `MAT_DIALOG_DATA` is required. `TimeTravelDialogComponent` injects `TimeTravelStore` directly to read the current server time at the moment of opening.

* **Interaction: `TimeTravelDialogComponent` → `TimeTravelStore`**
  * **Protocol:** Direct method call on injected store
  * **Payload Changes:**
    * `setTime(selectedDate: Date): Observable<void>` — called on Save. The `Date` value comes from the datetime picker form control.
    * `resetTime(): Observable<void>` — called on Reset. No parameters.

* **Interaction: `TimeTravelDialogComponent` → `MatDialogRef`**
  * **Protocol:** Angular Material dialog reference
  * **Payload Changes:** `MatDialogRef.close(true)` is called on successful API response. `MatDialogRef.close()` (no argument) is called automatically by the Material backdrop/Escape mechanism. `TimeTravelDisplayComponent` does not observe the dialog result; it is discarded.

* **Interaction: `TimeTravelStore` → `bikerental-backend` (via `TimeTravelControllerService`)**
  * **Protocol:** REST (PUT `/api/dev/time` for set; DELETE `/api/dev/time` for reset) — unchanged from FR-03
  * **Payload Changes:** No change from FR-03 contracts. The dialog triggers these interactions through `TimeTravelStore`.

---

## 5. Updated Interaction Sequence

**Happy path — Save:**

1. User clicks `TimeTravelDisplayComponent`; `MatDialog.open(TimeTravelDialogComponent)` is called.
2. Dialog opens; `TimeTravelDialogComponent` reads `TimeTravelStore.serverTime()?.instant`.
3. Datetime picker is pre-filled with the server instant (or browser time if `null`).
4. User adjusts the date/time and clicks **Save**.
5. `TimeTravelDialogComponent` calls `TimeTravelStore.setTime(selectedDate)`.
6. `TimeTravelStore` maps the date and delegates to `TimeTravelControllerService.setTime()`.
7. Backend responds 204; Observable completes.
8. `TimeTravelDialogComponent` calls `MatDialogRef.close(true)`.
9. Dialog is removed from the DOM.
10. SSE stream continues to push updated `serverTime` values; the toolbar display reflects the new fixed time within one second.

**Happy path — Reset:**

1. Dialog is open (same steps 1–3 as above).
2. User clicks **Reset**.
3. `TimeTravelDialogComponent` calls `TimeTravelStore.resetTime()`.
4. `TimeTravelStore` delegates to `TimeTravelControllerService.resetTime()`.
5. Backend responds 204; Observable completes.
6. `TimeTravelDialogComponent` calls `MatDialogRef.close(true)`.
7. Dialog closes; SSE stream resumes delivering real-time values.

**Unhappy path — HTTP error:**

1. User clicks **Save** or **Reset**; the API call is made.
2. Backend returns 4xx or 5xx.
3. `ErrorInterceptor` intercepts the error and calls `MatSnackBar.open()` with the error message.
4. `TimeTravelDialogComponent`'s Observable receives an error notification; the success-path `close(true)` is not called.
5. Dialog remains open; the user can retry or cancel.

**Unhappy path — user cancels:**

1. User clicks the backdrop or presses Escape.
2. Angular Material closes the dialog via `MatDialogRef.close()` (no argument).
3. No API call is made.

**Unhappy path — Save attempted with invalid / empty field:**

1. User clears the datetime picker field.
2. The reactive form control becomes invalid.
3. The **Save** button is disabled; user cannot submit.

---

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The dialog can only be reached by clicking `TimeTravelDisplayComponent`, which is wrapped in `@if (timeTravelEnabled)`. In production deployments where `timeTravelEnabled` is `false`, neither the trigger nor the dialog is ever rendered or instantiated. No additional access control is required.

* **Scale & Performance:** The dialog is instantiated on demand. It has no background polling or subscriptions; the `TimeTravelStore` SSE subscription, which was already open from toolbar initialisation, continues independently. The dialog does not open a second SSE connection. Using `OnPush` change detection ensures the picker field's reactivity is localised.
