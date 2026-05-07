# User Story: FR-08 — Dashboard Draft Resume Card

## 1. Description

**As an** operator
**I want to** see a prominent "Resume Draft" card on the dashboard when a rental draft was previously saved
**So that** I can continue a rental that was interrupted without having to remember or re-type any information

## 2. Context & Business Rules

* **Trigger:** Operator opens or returns to the Operator dashboard (`/dashboard`)
* **Rules Enforced:**
  * On dashboard load, the dashboard calls `GET /api/rentals?status=DRAFT&size=1&customerId=customerUuid` to check whether a DRAFT rental exists
  * If one or more DRAFT rentals are returned, the first result is used; a "Resume Draft" card is rendered at the top of the dashboard above existing content
  * The card displays: a label "Draft rental", the creation or last-updated timestamp of the draft, and the customer name/phone if a customer is already attached to the draft
  * The card contains a single primary action: "Resume" — navigates to `/rentals/new?id=:id`
  * The card also contains a secondary "Discard" action:
    * Tapping "Discard" shows a confirmation dialog ("Are you sure you want to discard this draft?")
    * On confirmation: calls `PATCH /api/rentals/{id}` with `{ op: 'replace', path: '/status', value: 'CANCELLED' }` to cancel the draft
    * On success: the card is removed from the dashboard
    * On error: a snackbar error is shown and the card remains
  * If no DRAFT rental exists, no card is shown; the dashboard renders as normal
  * The draft check is performed once on component init; there is no automatic polling

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Single GET call on dashboard init; result is held in a local signal and not cached beyond the current dashboard visit
* **Security/Compliance:** N/A
* **Usability/Other:** The card uses the existing `DashboardCardComponent` from `shared/components/dashboard-card/`; it is visually distinct (e.g. a different accent or icon) to signal an in-progress action

## 4. Acceptance Criteria (BDD)

**Scenario 1: Draft card appears when a DRAFT rental exists**

* **Given** `GET /api/rentals?status=DRAFT&size=1&customerId=uuid-1` returns a rental with id `42`, customerId `uuid-1`
* **When** the dashboard initialises
* **Then** a "Resume Draft" card is shown with the draft's timestamp and the "Resume" button

**Scenario 2: No draft card when no DRAFT rental exists**

* **Given** `GET /api/rentals?status=DRAFT&size=1&customerId=uuid-1` returns an empty result
* **When** the dashboard initialises
* **Then** no "Resume Draft" card is shown

**Scenario 3: Tapping Resume navigates to rental**

* **Given** the draft card is visible with rental `id: 42`
* **When** the operator taps "Resume"
* **Then** the router navigates to `/rentals/new?id=42`

**Scenario 4: Discard asks for confirmation**

* **Given** the draft card is visible
* **When** the operator taps "Discard"
* **Then** a confirmation dialog is shown before any API call is made

**Scenario 5: Confirmed discard cancels the draft and removes the card**

* **Given** the confirmation dialog is open
* **When** the operator confirms the discard and `PATCH /api/rentals/42` succeeds
* **Then** the draft card is removed from the dashboard

**Scenario 6: Discard API failure keeps the card**

* **Given** the operator confirms the discard
* **When** the PATCH call returns an error
* **Then** a snackbar error is shown and the draft card remains visible

## 5. Out of Scope

* Showing multiple draft cards (only the most recent draft is surfaced)
* Auto-discarding drafts older than a certain age
* Polling for new drafts while the dashboard is open
* Navigating to a list of all drafts
