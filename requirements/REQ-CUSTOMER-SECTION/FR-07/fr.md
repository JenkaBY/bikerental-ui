# User Story: FR-07 — Customer Transactions Tab

## 1. Description

**As an** admin user
**I want to** see a paginated, colour-coded list of financial transactions for a customer
**So that** I can audit account activity without leaving the customer detail page

## 2. Context & Business Rules

* **Trigger:** User activates the Transactions tab at `/customers/:id/transactions`
* **Rules Enforced:**
  * Calls `FinanceService.getTransactionHistory(customerId, filterParams, pageable)` on tab activate
  * No filter UI in scope — send empty `TransactionHistoryFilterParams` and default `Pageable` (page 0, size 20)
  * Each row displays: `recordedAt` (formatted date/time), `description` (if present, else `sourceType`), `amount`
  * Positive `amount` → text styled in the Material theme's success/green colour
  * Negative `amount` → text styled in the Material theme's `warn` colour
  * Pagination via `mat-paginator`; changing page re-calls the API with the new page index
  * The list is read-only

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Default page size 20; no infinite scroll; explicit page navigation only
* **Security/Compliance:** N/A
* **Usability/Other:** Loading indicator while fetching; empty-state message when no transactions exist; date formatted using Angular's `DatePipe` (`medium` or locale-equivalent)

## 4. Acceptance Criteria (BDD)

**Scenario 1: Transaction list loads on tab activate**

* **Given** the user activates the Transactions tab
* **When** the component initialises
* **Then** `getTransactionHistory` is called and transactions are rendered in a list

**Scenario 2: Positive amount is styled green**

* **Given** a transaction with `amount: 100`
* **When** rendered in the list
* **Then** the amount text uses a green colour class

**Scenario 3: Negative amount is styled warn**

* **Given** a transaction with `amount: -50`
* **When** rendered in the list
* **Then** the amount text uses the Material `warn` colour class

**Scenario 4: Paginator navigates pages**

* **Given** the transaction history has more than 20 items
* **When** the user clicks page 2 in `mat-paginator`
* **Then** `getTransactionHistory` is called with page index 1 and the list updates

**Scenario 5: Empty state**

* **Given** the customer has no transactions
* **When** `getTransactionHistory` returns an empty page
* **Then** an empty-state message is displayed

**Scenario 6: API error**

* **Given** `getTransactionHistory` returns an HTTP error
* **When** the tab initialises
* **Then** an error snackbar is shown and an empty list is displayed

## 5. Out of Scope

* Date range filtering
* Exporting transactions
* Aggregated totals or charts
