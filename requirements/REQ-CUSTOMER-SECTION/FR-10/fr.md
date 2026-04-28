# User Story: FR-10 — Create Customer Dialog

## 1. Description

**As an** admin user
**I want to** create a new customer from the customer list screen via a dialog
**So that** I can register a new customer immediately and be taken directly to their detail page

## 2. Context & Business Rules

* **Trigger:** User clicks the FAB (mobile) or the "New Customer" toolbar button (desktop) on the `/customers` list screen
* **Rules Enforced:**
  * On mobile (viewport `< md`): a `MatFab` (floating action button) is fixed at the bottom-right of the screen
  * On desktop (viewport `≥ md`): a standard `mat-button` or `mat-raised-button` is rendered in the list header/toolbar alongside the search input
  * Both triggers open `CustomerCreateDialogComponent` via `MatDialog.open(...)`
  * Dialog fields:
    - **Phone** (required): text input; must not be empty
    - **First Name** (required): text input; must not be empty
    - **Last Name** (required): text input; must not be empty
    - **Email** (optional): email-format text input
    - **Date of Birth** (optional): date picker
    - **Notes** (optional): textarea
  * Confirm button is disabled while the form is invalid
  * On Confirm: calls `CustomersService.createCustomer(CustomerWrite)` (maps to `POST /api/customers`)
  * On HTTP success: dialog closes, the router navigates to `/customers/:id` using the `id` returned in the response
  * On HTTP error: an error `MatSnackBar` is shown inside the dialog; the dialog is NOT closed
  * Cancel button always closes the dialog with no action
  * The dialog component lives at `customers/dialogs/customer-create-dialog/`

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Single API call on confirm; loading indicator on the Confirm button while the request is in flight
* **Security/Compliance:** Phone, firstName, and lastName must never be sent as empty strings (validated client-side before submission)
* **Usability/Other:** Confirm button is re-enabled on HTTP error so the user can retry; FAB must not obscure list content and should respect safe-area insets on mobile

## 4. Acceptance Criteria (BDD)

**Scenario 1: FAB visible on mobile**

* **Given** the viewport width is below the `md` breakpoint
* **When** the user is on `/customers`
* **Then** a floating action button is visible at the bottom-right of the screen

**Scenario 2: Toolbar button visible on desktop**

* **Given** the viewport width is at or above the `md` breakpoint
* **When** the user is on `/customers`
* **Then** a "New Customer" button is visible in the list header area alongside the search input; no FAB is shown

**Scenario 3: Dialog opens with empty form**

* **Given** the user taps/clicks the FAB or toolbar button
* **When** the dialog opens
* **Then** all fields are empty and the Confirm button is disabled

**Scenario 4: Confirm blocked while required fields are empty**

* **Given** the dialog is open
* **When** phone, firstName, or lastName is empty
* **Then** the Confirm button remains disabled and validation errors are shown on blur

**Scenario 5: Successful customer creation navigates to detail**

* **Given** the user has filled in phone, firstName, and lastName with valid values
* **When** the user clicks Confirm and the API returns 201 with the new customer's `id`
* **Then** the dialog closes and the router navigates to `/customers/:id`

**Scenario 6: API error keeps dialog open**

* **Given** the user submits a valid form
* **When** the API returns a 4xx or 5xx error
* **Then** a `MatSnackBar` error message is shown, the dialog remains open, and the Confirm button is re-enabled

**Scenario 7: Cancel closes dialog with no side effects**

* **Given** the dialog is open with partially filled fields
* **When** the user clicks Cancel
* **Then** the dialog closes with `undefined`, no API call is made, and the list is unchanged

## 5. Out of Scope

* Editing an existing customer from the list (handled by profile edit in FR-05)
* Duplicate phone number detection (backend responsibility)
* Assigning a customer to a rental immediately after creation
* Bulk customer import
