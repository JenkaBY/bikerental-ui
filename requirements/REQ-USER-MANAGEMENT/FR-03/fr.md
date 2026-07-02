# User Story: FR-03 — Create User Dialog

## 1. Description

**As an** admin user
**I want to** create a new user account from the Users list screen via a dialog
**So that** I can grant a new staff member (admin or operator) access to the system immediately

## 2. Context & Business Rules

* **Trigger:** Admin clicks a "New User" action on the `/admin/users` list screen (FR-02)
* **Rules Enforced:**
  * Dialog fields:
    - **Username** (required): text input; must not be empty
    - **Email** (required): text input; must be a valid email format
    - **Display name** (optional): text input
    - **Roles** (required, at least one): checkboxes/multi-select for `ADMIN` and `OPERATOR`
    - **Password** (optional): text input; if left blank the backend auto-generates one; if filled,
      it is sent as-is and used directly — no client-side strength/complexity rule beyond
      not-empty-if-provided
  * Confirm button is disabled while the form is invalid (missing username, missing/invalid email,
    or zero roles selected)
  * On Confirm: submits the create request
  * On success when the password field was left blank: the dialog hands off to the one-time
    temporary-password reveal (FR-07), displaying the backend-generated password
  * On success when a password was supplied by the admin: no reveal is needed (the admin already
    knows the password); a lightweight success confirmation is shown instead
  * On success either way: the underlying users list (FR-02) refreshes
  * On HTTP error (e.g. duplicate username or email): the error is surfaced inside the dialog via
    the standard error-handling toolkit; the dialog remains open so the admin can correct and retry
  * Cancel always closes the dialog with no side effects and no API call

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Single API call on confirm; a loading indicator is shown on the Confirm button
  while the request is in flight
* **Security/Compliance:** The plaintext password (whether admin-supplied or backend-generated)
  must never be logged or persisted outside the dialog's own in-flight state and, for the
  auto-generated case, the one-time reveal step
* **Usability/Other:** Confirm button is re-enabled after an error so the admin can retry without
  reopening the dialog; validation errors are shown on blur, not only on submit attempt

## 4. Acceptance Criteria (BDD)

**Scenario 1: Dialog opens with an empty form**

* **Given** the admin triggers the "New User" action
* **When** the dialog opens
* **Then** all fields are empty, no role is pre-selected, and the Confirm button is disabled

**Scenario 2: Confirm blocked while required fields are invalid**

* **Given** the dialog is open
* **When** username is empty, email is empty or malformed, or no role is selected
* **Then** the Confirm button remains disabled and the corresponding validation message is shown

**Scenario 3: Successful creation with blank password triggers the one-time reveal**

* **Given** the admin fills in a valid username, email, and at least one role, and leaves password
  blank
* **When** the admin clicks Confirm and the API succeeds
* **Then** the create dialog closes, the one-time temporary-password reveal (FR-07) opens showing
  the backend-generated password, and the users list refreshes

**Scenario 4: Successful creation with a supplied password skips the reveal**

* **Given** the admin fills in a valid username, email, at least one role, and a non-empty password
* **When** the admin clicks Confirm and the API succeeds
* **Then** the dialog closes, a lightweight success confirmation is shown (no password reveal), and
  the users list refreshes

**Scenario 5: Duplicate username or email keeps the dialog open**

* **Given** the admin submits a username or email that already exists
* **When** the API responds with a conflict error
* **Then** an inline error is shown identifying the problem, the dialog remains open, and the
  Confirm button is re-enabled for retry

**Scenario 6: Cancel closes the dialog with no side effects**

* **Given** the dialog is open with partially filled fields
* **When** the admin clicks Cancel
* **Then** the dialog closes, no API call is made, and the users list is unchanged

## 5. Out of Scope

* The temporary-password reveal dialog's own display/copy behavior — covered by FR-07
* Editing an existing user (covered by FR-04)
* Enforcing password strength/complexity rules
* Any test-file changes (MVP rule — no tests during this phase)
