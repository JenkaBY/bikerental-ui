# User Story: FR-02 — Rental Signal Store

## 1. Description

**As a** developer
**I want to** have a feature-scoped `RentalStore` that holds all state for the Create Rental flow, automatically recalculates the estimated cost, resolves the special tariff, and exposes methods for saving and activating the rental
**So that** all three step components share a single source of truth without prop drilling or duplicated API calls

## 2. Context & Business Rules

* **Trigger:** `RentalCreateComponent` is instantiated; the store is provided in its `providers` array so each visit to the route gets a fresh instance
* **Rules Enforced:**
  * The store is provided at `RentalCreateComponent` level — not `providedIn: 'root'`
  * State signals: `customer` (`Customer | null`), `durationMinutes` (`number`, default `30`), `equipmentItems` (`EquipmentSearchItem[]`, default `[]`), `discountPercent` (`number | null`, default `null`), `specialPriceEnabled` (`boolean`, default `false`), `specialPrice` (`number | null`, default `null`), `id` (`number | null`, default `null`), `specialTariffId` (`number | null`, default `null`)
  * `costEstimate` is a computed signal that triggers `TariffsService.calculateCost()` debounced whenever `durationMinutes`, `equipmentItems`, `discountPercent`, `specialPriceEnabled`, or `specialPrice` changes; it holds `RentalCostEstimate | null`
  * Cost calculation only fires when `equipmentItems` is non-empty; if empty, `costEstimate` is `null`
  * `projectedBalance` is a computed signal: `customer.balance.available - (costEstimate?.totalCost ?? 0)` — returns `null` when customer is not set
  * `canProceedFromStep2` is a computed signal: `equipmentItems.length > 0 && (!specialPriceEnabled || specialPrice !== null) && costEstimate !== null`
  * `isBalanceSufficient` is a computed signal: `projectedBalance !== null && projectedBalance >= 0`
  * Special tariff resolution: on store init, load all equipment types and find the first one with `isForSpecialTariff = true`; then fetch active SPECIAL tariff from `/api/tariffs/active?equipmentType={slug}`; store resulting `specialTariffId` in state
  * When special price mode is disabled, `specialPrice` must be reset to `null`
  * `save()`:
    * If `id` is `null`: call `POST /api/rentals/draft` to obtain a rental ID, then PATCH with current state
    * If `id` is set: call `PATCH /api/rentals/{id}` with current `customerId`, `equipmentIds`, `duration`
    * Activates a `isSaving` loading signal during the call
  * `activateRental()`: constructs `CreateRentalRequest` via `RentalMapper.toCreateRequest()` and calls `POST /api/rentals`; on success stores the returned `rentalId`
  * `loadRental(id: number)`: fetches `GET /api/rentals/{id}`, maps fields back into state signals, sets `id` signal
  * `reset()`: resets all state signals to their defaults

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Cost calculation uses `debounceTime(300ms)` on the reactive pipeline to avoid flooding the API; requests in flight are cancelled on new input
* **Security/Compliance:** No PII logged; only rental ID and event type are emitted to the logger
* **Usability/Other:** `isSaving` and `isActivating` loading signals are exposed so step components can disable action buttons during network calls

## 4. Acceptance Criteria (BDD)

**Scenario 1: costEstimate reacts to duration change**

* **Given** the store has one equipment item and `durationMinutes` is 60
* **When** `durationMinutes` is set to 120
* **Then** after the debounce period, `TariffsService.calculateCost()` is called with `plannedDurationMinutes: 120` and `costEstimate` is updated with the response

**Scenario 2: costEstimate is null when equipment list is empty**

* **Given** the store has no equipment items
* **When** `durationMinutes` changes
* **Then** `costEstimate` remains `null` and no API call is made

**Scenario 3: canProceedFromStep2 is false when special price mode is active but price is null**

* **Given** `specialPriceEnabled` is `true`, `specialPrice` is `null`, and `equipmentItems` is non-empty
* **When** `canProceedFromStep2` is read
* **Then** it returns `false`

**Scenario 4: canProceedFromStep2 is true when all conditions met**

* **Given** `equipmentItems` has one item, `specialPriceEnabled` is `false`, `discountPercent` is `0`, and `costEstimate` is set
* **When** `canProceedFromStep2` is read
* **Then** it returns `true`

**Scenario 5: save creates a new rental when id is null**

* **Given** `id` is `null` and the store has customer + equipment set
* **When** `save()` is called
* **Then** `POST /api/rentals/draft` is called, the returned rental `id` is stored in the `id` signal, and `PATCH /api/rentals/{id}` is called with current customer, equipment, and duration

**Scenario 6: reset clears all state**

* **Given** the store has customer, equipment, and a rental id
* **When** `reset()` is called
* **Then** all signals return to their default values

**Scenario 7: special tariff is resolved on store init**

* **Given** an equipment type with `isForSpecialTariff = true` and slug `'special-bike'` exists in the equipment type list
* **When** the store initialises
* **Then** `GET /api/tariffs/active?equipmentType=special-bike` is called and the first returned SPECIAL tariff ID is stored in `specialTariffId`

## 5. Out of Scope

* Persisting draft state to `localStorage`
* Managing multiple concurrent drafts
* Handling rental cancellation or editing after activation
* Payment recording (handled by the return flow or the admin area)
