# User Story: FR-04 — Customer Profile Tab

## 1. Description

**As an** admin user
**I want to** view and edit a customer's profile fields on the Profile tab
**So that** I can correct contact details or add notes without leaving the customer detail page

## 2. Context & Business Rules

* **Trigger:** User activates the Profile tab at `/customers/:id/profile`
* **Rules Enforced:**
  * The component operates in two mutually exclusive states: **view mode** and **edit mode**
  * View mode is the default on load; it shows fields as read-only text
  * Edit button in view mode switches to edit mode
  * Fields: `phone` (required), `firstName` (required), `lastName` (required), `birthDate` (optional, date picker), `notes` (optional, textarea) — maps to `comments` in the API
  * No `status` field is shown or editable
  * On Save: calls `CustomersService.updateCustomer(id, request)` — HTTP PUT with the full `CustomerRequest` payload; missing optional fields are sent as `undefined` for optional field
  * On HTTP success: switch back to view mode, show success `MatSnackBar`
  * On HTTP error: remain in edit mode, show error `MatSnackBar`
  * Cancel: discard form changes and revert to view mode with previously loaded values
  * Save button is disabled when the form is invalid (phone empty)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Profile data is passed down from the shell via an `input()` signal — no additional HTTP call on tab activate
* **Security/Compliance:** N/A
* **Usability/Other:** `mat-form-field` used for all inputs; `mat-datepicker` for `birthDate`; validation errors shown inline

## 4. Acceptance Criteria (BDD)

**Scenario 1: View mode displays all fields**

* **Given** the shell has loaded a customer with all fields populated
* **When** the Profile tab is active and in view mode
* **Then** phone, first name, last name, date of birth, and notes are all visible as read-only text

**Scenario 2: Edit button switches to edit mode**

* **Given** the user is in view mode
* **When** the user clicks Edit
* **Then** all fields become editable `mat-form-field` inputs and Save + Cancel buttons appear

**Scenario 3: Save submits updated profile**

* **Given** the user is in edit mode and has changed the first name
* **When** the user clicks Save and the HTTP PUT succeeds
* **Then** the component returns to view mode and a success snackbar is shown

**Scenario 4: Save is disabled when phone is empty**

* **Given** the user is in edit mode and has cleared the phone field
* **When** the Save button is rendered
* **Then** the Save button is disabled

**Scenario 5: Cancel restores original values**

* **Given** the user has modified fields in edit mode
* **When** the user clicks Cancel
* **Then** the form is discarded and the component returns to view mode showing the original values

**Scenario 6: HTTP error stays in edit mode**

* **Given** the user submits the form and the API returns a 4xx/5xx error
* **When** the response is received
* **Then** the component remains in edit mode and an error snackbar is shown

## 5. Out of Scope

* Changing customer status
* Email field (not shown in this section's requirements)
* Password or credential management
