# User Story: FR-02 — Users List View & Self-Lockout Row Gating

## 1. Description

**As an** admin user
**I want to** see a table of all user accounts at `/admin/users`, with row actions gated so I can
never act on my own account
**So that** I can review who has access to the system and safely manage other staff accounts
without accidentally locking myself out

## 2. Context & Business Rules

* **Trigger:** Admin navigates to `/admin/users` (existing "Users" nav item, icon
  `manage_accounts`, already present in the admin sidebar)
* **Rules Enforced:**
  * The existing placeholder screen must be replaced with the full implementation
  * Single flat table — no pagination, no search/filter controls (dataset is small by design, ~20
    users max)
  * Columns, in order: username, email, display name, roles, status, last login, row-actions
  * Roles column renders each role as a chip (`ADMIN`, `OPERATOR`); a user always has at least one
  * Status column renders a badge distinguishing `ACTIVE` from `DISABLED`
  * Last-login column shows the formatted date/time, or "Never" when the value is absent
  * Row-actions column renders three controls per row: edit, reset password, and a single
    activate/deactivate toggle whose icon and behavior reflect the row's current status
  * **Self-lockout rule:** for the row whose `id` matches the currently authenticated admin's own
    `id` (read from the existing session identity store), all three row actions are disabled or
    hidden — the acting admin can never edit, deactivate, reset the password of, or change the
    role/status of their own account from this screen
  * **Protected bootstrap-admin rule:** the row whose `username` is exactly `admin` (the
    bootstrapped super-user account) has all three row actions disabled or hidden for every admin
    viewing the screen, including admins other than the bootstrap account itself — nobody may edit,
    deactivate, reset the password of, or change the role/status of this account from this screen.
    This account may only change its own credentials through the existing self-service "Change
    Password" flow, not through admin-triggered actions here. This rule is independent of and
    stacks with the self-lockout rule above (both are evaluated per row; either one being true locks
    the row)
  * The list loads once on navigation to the screen and refreshes automatically whenever a
    create/edit/deactivate/activate/reset-password action elsewhere on the screen completes
    successfully

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Single unpaginated list load; no debounce/search needed given dataset size
* **Security/Compliance:** Self-lockout gating is a UI-level convenience, not a security boundary
  — the backend is the authority for what an admin may do to their own account; this rule exists
  purely to prevent accidental self-lockout via the UI
* **Usability/Other:** Empty state message if there are zero users (should not realistically occur
  since at least the acting admin exists); error state via the standard error-handling toolkit if
  the list fails to load

## 4. Acceptance Criteria (BDD)

**Scenario 1: List loads and renders all users**

* **Given** the admin navigates to `/admin/users`
* **When** the screen initializes
* **Then** all user accounts are fetched and rendered in the table with the specified columns

**Scenario 2: Roles rendered as chips**

* **Given** a user row has `roles: ['ADMIN', 'OPERATOR']`
* **When** the row renders
* **Then** two chips are shown, one per role

**Scenario 3: Status rendered as a badge**

* **Given** a user row has `status: 'DISABLED'`
* **When** the row renders
* **Then** a badge visually distinct from the `ACTIVE` badge is shown for that row

**Scenario 4: Last login shows "Never" when absent**

* **Given** a user row has no `lastLoginAt` value
* **When** the row renders
* **Then** the last-login column displays "Never" (or an em-dash placeholder) instead of a blank
  cell

**Scenario 5: Own-account row has all actions disabled**

* **Given** one of the rows corresponds to the currently authenticated admin's own account
* **When** the table renders
* **Then** the edit, reset-password, and activate/deactivate controls for that row are disabled or
  hidden, while the same controls remain fully usable on every other row

**Scenario 6: Other rows remain fully actionable**

* **Given** a row does not correspond to the authenticated admin's own account
* **When** the table renders
* **Then** the edit, reset-password, and activate/deactivate controls for that row are all enabled

**Scenario 6a: Bootstrap admin row is locked for every viewer**

* **Given** a row has `username: 'admin'`, and the currently authenticated admin is a different
  account
* **When** the table renders
* **Then** the edit, reset-password, and activate/deactivate controls for that row are disabled,
  with a tooltip explaining the account is protected

**Scenario 7: Toggle icon reflects current status**

* **Given** a row has `status: 'ACTIVE'`
* **When** the row renders
* **Then** the activate/deactivate control shows the "deactivate" icon/state; conversely a
  `DISABLED` row shows the "activate" icon/state

**Scenario 8: List refreshes after a mutation elsewhere on the screen**

* **Given** the admin successfully completes a create, edit, deactivate, activate, or
  reset-password action
* **When** that action's dialog closes
* **Then** the table reflects the updated data without a manual page reload

**Scenario 9: Load failure shows an error state**

* **Given** the initial list request fails
* **When** the screen finishes loading
* **Then** an error notification is shown via the standard error-handling toolkit and the table
  shows an empty/error state rather than stale or partial data

## 5. Out of Scope

* The behavior triggered by clicking edit, reset-password, or the activate/deactivate toggle —
  covered by FR-04, FR-06, and FR-05 respectively
* The create-user entry point and dialog — covered by FR-03
* Search, filter, sort, or pagination controls (explicitly not needed for this dataset size)
* Any test-file changes (MVP rule — no tests during this phase)
