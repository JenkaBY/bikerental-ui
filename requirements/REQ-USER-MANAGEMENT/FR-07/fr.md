# User Story: FR-07 — One-Time Temporary Password Reveal Dialog

## 1. Description

**As an** admin user
**I want to** see a newly generated temporary password exactly once, with an easy way to copy it
**So that** I can securely hand it off to the affected staff member, knowing it can never be
retrieved again afterward

## 2. Context & Business Rules

* **Trigger:** A create-user action with no supplied password (FR-03) or a reset-password action
  (FR-06) completes successfully and returns a plaintext temporary password
* **Rules Enforced:**
  * The dialog displays the temporary password in a masked (`type="password"`) field by default, so
    it is not visible in screen shares or screenshots taken without deliberate action; a "show
    password" toggle reveals it as plain, selectable text on demand, and can be toggled back to
    masked
  * A copy-to-clipboard action is provided, with visible confirmation that the copy succeeded
  * A clear, explicit warning is shown that this is the only time the password will ever be
    displayed and that it cannot be retrieved again after the dialog closes
  * Closing the dialog (via an explicit "Done"/close action) is the only way to dismiss it; once
    closed, the plaintext value is discarded from memory/state and is not shown again by this or
    any other screen
  * The dialog carries no further actions besides copy and close (e.g. it does not trigger another
    API call)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — purely a display dialog with no I/O
* **Security/Compliance:** The plaintext password must never be logged, written to
  `localStorage`/`sessionStorage`, or retained in any signal/state beyond the lifetime of this
  dialog; once dismissed, no part of the app can re-display the same value
* **Usability/Other:** The warning copy must be unambiguous about the one-time nature of the reveal
  so admins are not tempted to close the dialog before recording the password

## 4. Acceptance Criteria (BDD)

**Scenario 1: Password is masked by default**

* **Given** a create or reset-password action has just returned a temporary password
* **When** the reveal dialog opens
* **Then** the password field is masked (not readable as plain text), alongside the one-time-only
  warning and a "show password" toggle

**Scenario 1a: Show-password toggle reveals and re-hides the password**

* **Given** the reveal dialog is open with the password masked
* **When** the admin clicks the "show password" toggle
* **Then** the password becomes visible as plain, selectable text, and clicking the toggle again
  re-masks it

**Scenario 2: Copy action copies the password**

* **Given** the reveal dialog is open
* **When** the admin clicks the copy action
* **Then** the password is copied to the clipboard and a visible confirmation is shown (e.g. a
  brief success indicator)

**Scenario 3: Closing the dialog discards the value**

* **Given** the reveal dialog is open
* **When** the admin closes it
* **Then** the plaintext password is no longer accessible anywhere in the app's state, and
  reopening any other dialog does not show a stale or cached copy of it

**Scenario 4: Reused for both create and reset-password flows**

* **Given** either FR-03 (create with no supplied password) or FR-06 (reset-password) completes
  successfully
* **When** the resulting response is handed to this dialog
* **Then** the same reveal behavior (display, copy, one-time warning, discard-on-close) applies
  identically regardless of which flow triggered it

## 5. Out of Scope

* The business logic that decides when to open this dialog (owned by FR-03 and FR-06)
* Any persistence, history, or audit trail of previously issued temporary passwords
* Any test-file changes (MVP rule — no tests during this phase)
