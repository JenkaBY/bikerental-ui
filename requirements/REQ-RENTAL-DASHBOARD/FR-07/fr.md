# User Story: FR-07 — Rental Detail — Customer Section

## 1. Description

**As an** operator
**I want to** see the customer's name, phone number, current balance, and a "Top Up" button
in the Customer section of the Rental Detail screen
**So that** I can quickly assess the customer's financial situation and top up their balance
without leaving the rental context

## 2. Context & Business Rules

* **Trigger:** Rental detail data has loaded and the Customer section is rendered
* **Rules Enforced:**
  * The section **reuses the existing `RentalCustomerPanelComponent`**
    (`app-rental-customer-panel`) from the Create Rental flow — it is not reimplemented
  * The section is identical for all rental statuses (ACTIVE, DEBT, and any other)
  * The `RentalCustomerPanelComponent` injects `RentalStore` by DI token; the Rental
    Detail feature must provide a compatible store that exposes:
    - `customer(): Customer | null` — the existing `Customer` type from `core/models/customer.model.ts` (`{ phone, firstName?, lastName? }`)
    - `customerBalance(): CustomerBalance | null` — the existing `CustomerBalance` type from `core/models/customer-balance.model.ts`
    - `isBalanceSufficient(): boolean`
  * **DI pattern**: `RentalCustomerPanelComponent` currently calls `inject(RentalStore)` directly; to reuse it in the detail context, an `InjectionToken` must be defined (e.g., in `core/state/rental-panel-store.token.ts`) that both the create-flow `RentalStore` and the new detail store satisfy; each context provides its implementation at the component's `providers: []`
  * Balance refresh is delegated to `CustomerFinanceStore.loadById(customerId)` (existing `core/state/customer-finance.store.ts`); the detail store injects `CustomerFinanceStore` and calls `loadById` when rental detail loads
  * The component emits a `topUpRequested` output; the parent (Rental Detail page)
    listens to it and opens the existing `TopUpDialogComponent` passing
    `{ customerId }` with `disableClose: true`
  * After the dialog closes with result `true`, the parent refreshes the customer
    balance by reloading the relevant store state
  * The section is separated from adjacent sections by a divider

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — the balance value is part of the already-fetched `RentalDetail`
* **Security/Compliance:** Customer phone and name are PII; they are displayed but must
  not be logged by the component
* **Usability/Other:** The "Top Up" button must be reachable with one thumb on a phone
  screen; the balance amount must be large enough to read at a glance

## 4. Acceptance Criteria (BDD)

**Scenario 1: Customer name and phone displayed correctly**

* **Given** a `RentalDetail` with `customerName: 'Ivan Petrov'` and
  `customerPhone: '+375291234567'`
* **When** the Customer section renders
* **Then** "Ivan Petrov" appears below "+375291234567"

**Scenario 2: Positive balance displayed in success color**

* **Given** `customerBalance.available.amount > 0`
* **When** the Customer section renders
* **Then** the balance amount is styled with the positive color (green)

**Scenario 3: Negative or zero balance displayed in warning color**

* **Given** `customerBalance.available.amount <= 0`
* **When** the Customer section renders
* **Then** the balance amount is styled with the warning color

**Scenario 4: Tapping "Top Up" opens TopUpDialogComponent**

* **Given** the operator is on the detail screen for rental with `customerId: 'cust-uuid'`
* **When** the operator taps the top-up button
* **Then** `TopUpDialogComponent` opens with `data: { customerId: 'cust-uuid' }` and
  `disableClose: true`

**Scenario 5: Balance refreshed after successful top-up**

* **Given** the top-up dialog closes with result `true`
* **When** the `afterClosed` subscription fires
* **Then** the customer balance on the screen is refreshed to reflect the new amount

## 5. Out of Scope

* Creating or editing the customer profile from this screen
* Viewing transaction history from this screen

## 6. Screen Specification

### Layout

```
┌─────────────────────────────────────────────┐
│  app-rental-customer-panel (reused)          │
│                                             │
│  +375291234567             Balance: 500 BYN │
│  Ivan Petrov               [ Top Up ]       │
└─────────────────────────────────────────────┘
```

### Elements

| Element                     | Position   | Description                                                                 |
|-----------------------------|------------|-----------------------------------------------------------------------------|
| `app-rental-customer-panel` | Full width | Reused component; displays phone, optional name, balance, and top-up button |

### Transitions

| Interaction                                    | Outcome                                                                            |
|------------------------------------------------|------------------------------------------------------------------------------------|
| Tap top-up button                              | `TopUpDialogComponent` opens (existing shared dialog); page does not navigate away |
| Top-up dialog closes with `true`               | Customer balance refreshes in the section                                          |
| Top-up dialog closes with `false` or dismissed | No change                                                                          |
