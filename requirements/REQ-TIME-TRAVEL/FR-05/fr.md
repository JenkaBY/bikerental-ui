# User Story: FR-05 — Time Travel Dialog

## 1. Description

**As an** operator or admin user
**I want to** open a dialog from the toolbar clock, pick a custom datetime, and either save it or reset the server clock to real time
**So that** I can shift the backend's perceived time for testing time-sensitive rental and tariff scenarios

## 2. Context & Business Rules

* **Trigger:** The user clicks the `TimeTravelDisplayComponent` in the toolbar
* **Rules Enforced:**
  * The dialog component is `TimeTravelDialogComponent`, located in `projects/shared/src/shared/components/time-travel-dialog/`
  * The dialog is opened via `MatDialog.open()` — no routing involved
  * When the dialog opens, the datetime input is pre-filled with the value of `TimeTravelStore.serverTime()?.instant` at the moment the dialog was opened; if `serverTime()` is `null`, the field is pre-filled with the current browser time as a fallback
  * The dialog contains a single Angular Material datetime picker field and two action buttons: **Save** and **Reset**
  * **Save** is disabled while the datetime field is empty or invalid
  * Clicking **Save** calls `TimeTravelStore.setTime(selectedDate)` and, on a successful API response, closes the dialog by calling `MatDialogRef.close(true)`
  * Clicking **Reset** calls `TimeTravelStore.resetTime()` and, on a successful API response, closes the dialog by calling `MatDialogRef.close(true)`
  * If the API call returns an error, the dialog remains open; the global `ErrorInterceptor` surfaces the error to the user via snackbar — the dialog itself does not render an error message
  * Clicking the backdrop or pressing Escape closes the dialog without any API call (`MatDialogRef.close()` with no argument)
  * The component uses `ChangeDetectionStrategy.OnPush`

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — the dialog is opened on demand; no background polling inside it
* **Security/Compliance:** The dialog is only reachable when `timeTravelEnabled` is `true` (enforced by FR-04 hiding the trigger); no additional access control needed
* **Usability/Other:** The datetime picker must allow selection of both date and time (not date only); the Save button label and Reset button label must use `$localize` i18n constants from `shared/constant/labels.ts`

## 4. Acceptance Criteria (BDD)

**Scenario 1: Dialog opens pre-filled with server time**

* **Given** `serverTime()` returns `{ instant: Date('2026-05-22T10:30:00Z'), fixed: false }`
* **When** the user clicks the toolbar time display
* **Then** the dialog opens with the datetime picker pre-set to the instant `2026-05-22T10:30:00Z`

**Scenario 2: Save calls setTime and closes**

* **Given** the dialog is open with a valid datetime selected
* **When** the user clicks **Save** and the API responds with success
* **Then** `TimeTravelStore.setTime()` is called with the selected date and the dialog closes

**Scenario 3: Reset calls resetTime and closes**

* **Given** the dialog is open
* **When** the user clicks **Reset** and the API responds with success
* **Then** `TimeTravelService.resetTime()` is called and the dialog closes

**Scenario 4: Save disabled when field is empty**

* **Given** the dialog is open and the datetime field has been cleared
* **When** the user views the Save button
* **Then** the Save button is disabled

**Scenario 5: Dialog stays open on API error**

* **Given** the dialog is open and the user clicks Save
* **When** the API returns an error response
* **Then** the dialog remains open and no close event is emitted

**Scenario 6: Cancel closes without API call**

* **Given** the dialog is open
* **When** the user clicks the backdrop or presses Escape
* **Then** the dialog closes and neither `setTime` nor `resetTime` is called

## 5. Out of Scope

* Inline validation messages inside the dialog (relies on Angular Material field validators)
* Confirmation step before saving or resetting
* Ability to set time as a relative offset (e.g., "+2 hours") rather than an absolute datetime
* History of previously set times
