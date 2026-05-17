# System Design: FR-01 — Rental Dashboard Domain Model, Mapper & RentalListStore

## 1. Architectural Overview

FR-01 establishes the foundational data layer for the entire Rental Dashboard feature. New domain
model interfaces are added to the shared library's `core/models/` layer, making them the exclusive
types consumed by all dashboard and detail components. A new pure-static mapper class
(`RentalDashboardMapper`) is added to `core/mappers/` to translate generated API response shapes
into these domain types, enforcing the three-layer data pipeline.

A feature-scoped `RentalListStore` is introduced in the Operator SPA to orchestrate the two-phase
batch load (rental summaries → customer names + equipment display names). The store is provided at
the `RentalDashboardComponent` level so its lifetime matches the route, and it exposes ready-to-use
`RentalListItem` signals to the tab components below it. The backend `ReturnEquipmentRequest`
contract must be extended with two new optional fields before client-side implementation of the
return flow (FR-12) is possible.

A critical business rule applies to **active** rentals: once a rental has been started (status
transitioned from DRAFT to ACTIVE), its parameters are **immutable** — planned duration,
equipment list, customer, and tariff cannot be changed. The only permitted mutations for an active
rental are lifecycle transitions: return the equipment or cancel the rental. DRAFT rentals that
appear in the history tab are handled by redirecting the operator back to the existing Create
Rental stepper flow (step 2) rather than opening the detail page; `RentalDetailState` therefore
never holds a DRAFT rental and `isActivating` from `RentalState` is **not applicable** to
`RentalDetailState`.

## 2. Impacted Components

* **`core/models/` (Shared Library — Domain Models):** Must be extended with five new read-only
  domain interfaces: `RentalListItem`, `RentalDetailState` (extends existing `RentalState`),
  `RentalEquipmentItem` (extends existing `EquipmentSearchItem`), `ReturnEquipmentWrite`, and
  `BrokenEquipmentEntry`. All five are exported from the shared `core/models/index` barrel.

* **`core/mappers/` (Shared Library — RentalDashboardMapper):** *(New component)* A new pure-static
  mapper class responsible for three conversions: (1) `toListItem` — maps a raw rental summary
  response plus a customer record and an equipment-name lookup table to a `RentalListItem`; (2)
  `toDetailState` — maps a raw rental detail response plus a customer record to a
  `Partial<RentalDetailState>`; (3) `toReturnRequest` — maps a `ReturnEquipmentWrite` domain
  write object to the generated `ReturnEquipmentRequest` API shape. No Angular DI, no side effects.

* **`RentalListStore` (Operator SPA — Feature Store):** *(New component)* A feature-scoped store
  provided at the `RentalDashboardComponent` level. Manages four state signals: `activeRentals`,
  `historyRentals`, `isLoadingActive`, and `isLoadingHistory`. Exposes `loadActive()` and
  `loadHistory(dateFrom, dateTo)` operations, each executing a three-step batch load. Consumes
  `RentalsService`, `CustomersService`, and `EquipmentsCatalogueService` from the generated API
  layer, and applies `RentalDashboardMapper` to produce domain objects.

* **`RentalsService` (Generated — bikerental-backend contract):** The existing generated service
  must be regenerated after the backend extends `ReturnEquipmentRequest` with optional
  `discountPercent` and `specialPrice` fields. The `getRentals` operation must accept optional
  `from` and `to` date-boundary parameters for the history endpoint.

## 3. Abstract Data Schema Changes

* **Entity: `RentalListItem`** (new, read-only domain view)
  * **Attributes Added:**
    `id` (Integer), `status` (String slug), `customerPhone` (String),
    `customerName` (optional String), `startedAt` (DateTime), `equipmentNames` (String list),
    `expectedReturnAt` (optional DateTime), `isActive` (Boolean), `isDebt` (Boolean),
    `isOverdue` (Boolean), `overdueMinutes` (optional Integer)

* **Entity: `RentalDetailState`** (new, extends existing `RentalState`)
  * **Attributes Added (beyond those already in `RentalState`):**
    `status` (String slug), `customerId` (String), `customerBalance` (Money, optional),
    `startedAt` (DateTime, nullable), `expectedReturnAt` (optional DateTime),
    `paidDurationMinutes` (optional Integer, mapped from `actualDurationMinutes`),
    `finalCost` (Money, optional), `debtAmount` (Money, optional — populated only when
    `isDebt === true`), `isActive` (Boolean), `isDebt` (Boolean), `isOverdue` (Boolean),
    `overdueMinutes` (optional Integer), `brokenEquipmentEntries` (BrokenEquipmentEntry list),
    `isReturning` (Boolean)
  * **Note on `RentalState` base fields:** `isActivating` from `RentalState` is **not applicable**
    to `RentalDetailState` — the detail page never handles DRAFT rentals (they redirect to the
    Create Rental stepper instead). All other `RentalState` display fields (`id`, `customer`,
    `equipmentItems`, `durationMinutes`, `discountPercent`, `specialPrice`, `specialPriceEnabled`,
    `isSaving`, `isLoading`) are reused with their existing semantics. For ACTIVE and DEBT rentals,
    the rental parameters carried by these fields are **read-only** — they reflect persisted
    backend state and cannot be modified by the operator.

* **Entity: `RentalEquipmentItem`** (new, extends existing `EquipmentSearchItem`)
  * **Attributes Added:** `statusSlug` (String), `isReturned` (Boolean, derived:
    `statusSlug === 'RETURNED'`)

* **Entity: `ReturnEquipmentWrite`** (new, write-side domain model)
  * **Attributes:** `rentalId` (Integer), `equipmentItemIds` (Integer list),
    `discountPercent` (optional Decimal), `specialPrice` (optional Decimal)

* **Entity: `BrokenEquipmentEntry`** (new)
  * **Attributes:** `equipmentItemId` (Integer), `penaltyAmount` (optional Decimal)

* **Entity: `ReturnEquipmentRequest`** (existing generated backend contract — extension required)
  * **Attributes Added:** `discountPercent` (optional Decimal), `specialPrice` (optional Decimal)
    — Note: `equipmentItemIds` in the domain model maps to `equipmentIds` in the API contract.

## 4. Component Contracts & Payloads

* **Interaction: `RentalListStore` -> `RentalsService` (loadActive)**
  * **Protocol:** REST (GET)
  * **Payload Changes:** `GET /api/rentals?status=ACTIVE&page=0&size=100` — existing endpoint,
    no new fields required for the active load path.

* **Interaction: `RentalListStore` -> `RentalsService` (loadHistory)**
  * **Protocol:** REST (GET)
  * **Payload Changes:** `GET /api/rentals?from={date}&to={date}` — the `from` and
    `to` date-boundary parameters must be supported by the backend. The backend is responsible for
    applying time suffix logic; the store passes ISO date strings.

* **Interaction: `RentalListStore` -> `CustomersService` (batch)**
  * **Protocol:** REST (GET or POST batch)
  * **Payload Changes:** Request carries a list of unique customer IDs; response returns a
    `CustomerResponse` list, one entry per requested ID. No new fields — existing service reused.

* **Interaction: `RentalListStore` -> `EquipmentsCatalogueService` (batch)**
  * **Protocol:** REST (GET or POST batch)
  * **Payload Changes:** Request carries a list of unique equipment item IDs; response returns
    equipment records including the display name (`model` field). No new fields — existing service
    reused.

* **Interaction: `RentalDashboardMapper` -> domain output**
  * **Protocol:** In-process pure function (no network)
  * **Payload Changes:** `toListItem` consumes `RentalSummaryResponse` + `CustomerResponse | null`
    + `Map<Integer, String>` (equipment ID → name) and returns `RentalListItem`. `toDetailState`
      consumes `RentalResponse` + `CustomerResponse | null` and returns `Partial<RentalDetailState>`.
      `toReturnRequest` consumes `ReturnEquipmentWrite` and returns `ReturnEquipmentRequest`.

## 5. Updated Interaction Sequence

### loadActive — Happy Path

1. `RentalListStore` sets `isLoadingActive = true` and calls `RentalsService.getRentals` with
   `status = ACTIVE`, `page = 0`, `size = 100`.
2. `RentalsService` returns a paginated list of `RentalSummaryResponse` items.
3. `RentalListStore` collects all unique `customerId` values from the response items and calls
   `CustomersService.getCustomersBatch(customerIds)`.
4. `RentalListStore` collects all unique equipment item IDs from `response.items[].equipmentIds`
   and calls `EquipmentsCatalogueService.getBatchEquipments(equipmentIds)`.
5. `RentalListStore` builds an equipment-name map (`Map<Integer, String>`) from the equipment batch
   response (`id → model`).
6. `RentalListStore` applies `RentalDashboardMapper.toListItem(r, customerMap.get(r.customerId), equipmentNameMap)` to each rental summary.
7. `RentalListStore` sets `activeRentals` to the mapped list and `isLoadingActive = false`.

### loadHistory — Happy Path

1. `RentalListStore` sets `isLoadingHistory = true` and calls `RentalsService.getRentals` with
   `from = {date}` and `to = {date}`, `page = 0`, `size = 100`.
2. Steps 2–6 are identical to `loadActive` except the rental list is stored in `historyRentals`.
3. `RentalListStore` sets `historyRentals` and `isLoadingHistory = false`.

### loadActive — Error Path

1. Any of the three API calls fails.
2. `RentalListStore` sets `isLoadingActive = false`; the error is surfaced via the global
   `ErrorService` (existing HTTP interceptor); `activeRentals` retains its previous value.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII is logged by the mapper or store; only rental IDs and event type
  labels are passed to the logger. Customer phone and name fields are treated as sensitive display
  data and never serialised to debug output.
* **Scale & Performance:** All mapper methods are O(n) pure functions with no async work. The
  three-step batch load executes steps 3 and 4 in parallel (concurrent requests) before mapping,
  minimising round-trip latency. The `size` caps (`100` for active, `100` for history) bound
  memory usage to a predictable range for typical shop sizes.
