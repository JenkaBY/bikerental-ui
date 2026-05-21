# User Story: FR-01 — Rental Dashboard Domain Model, Mapper & RentalListStore

## 1. Description

**As a** developer
**I want to** have typed domain interfaces for the Rental Dashboard and Detail flows
(`RentalListItem`, `RentalDetailState` (extends `RentalState`), `RentalEquipmentItem`
(extends `EquipmentSearchItem`), `ReturnEquipmentWrite`, `BrokenEquipmentEntry`), a
pure-static `RentalDashboardMapper` that converts generated API shapes to those types, and
a feature-scoped `RentalListStore` that orchestrates data loading and exposes the mapped
domain objects to components
**So that** all dashboard and detail components import only clean domain types from `core/models/`
and remain fully decoupled from the auto-generated API contract

## 2. Context & Business Rules

* **Trigger:** Any component in the Rental Dashboard or Rental Detail feature needs to read or
  write rental list or rental detail data
* **Rules Enforced:**
  * `RentalListItem` must expose:
    `id: number`, `status: string` (raw slug), `customerPhone: string`,
    `customerName?: string`, `startedAt: Date`,
    `equipmentNames: string[]`, `expectedReturnAt?: Date`,
    `isActive: boolean`, `isDebt: boolean`, `isOverdue: boolean`,
    `overdueMinutes?: number`
    (`customerPhone`/`customerName` are populated via `CustomersService.getCustomersBatch()`;
    `equipmentNames` are populated via `EquipmentsCatalogueService.getBatchEquipments()`;
    `debtAmount` is a detail-only field — not exposed on the list item)
  * **No new `RentalDetail` type** — the detail store's internal state type is
    `RentalDetailState` which **extends the existing `RentalState`** from
    `core/models/rental-create.model.ts`, adding only the fields not already in `RentalState`:
    `status: string`, `customerId: string`, `customerBalance?: Money`,
    `startedAt: Date | null`, `expectedReturnAt?: Date`,
    `paidDurationMinutes?: number` (mapped from `r.actualDurationMinutes`),
    `finalCost?: Money`, `debtAmount?: Money` (populated only when `isDebt === true`),
    `isActive: boolean`, `isDebt: boolean`, `isOverdue: boolean`,
    `overdueMinutes?: number`, `brokenEquipmentEntries: BrokenEquipmentEntry[]`,
    `isReturning: boolean`;
    fields already in `RentalState` that are reused: `id`, `customer` (provides
    `customer?.phone` and `customer?.firstName`/`lastName` instead of separate
    `customerPhone`/`customerName` fields), `equipmentItems`, `durationMinutes`
    (= `plannedDurationMinutes`), `discountPercent`, `specialPrice`,
    `specialPriceEnabled`, `isSaving`, `isActivating`, `isLoading`
  * **`RentalEquipmentItem` extends `EquipmentSearchItem`** (from
    `core/models/equipment.model.ts`) with two additional readonly fields:
    `statusSlug: string` and `isReturned: boolean` (derived as `statusSlug === 'RETURNED'`);
    `EquipmentSearchItem.model` serves as the equipment display name;
    `EquipmentSearchItem.type.slug` serves as the category slug;
    `RentalEquipmentItem` is exported from `core/models/index.ts`
  * `ReturnEquipmentWrite` must expose:
    `rentalId: number`, `equipmentItemIds: number[]`, `discountPercent?: number`,
    `specialPrice?: number`; the `BrokenEquipmentEntry[]` is passed separately as a
    co-parameter; `ReturnEquipmentWrite` does not embed it
  * `BrokenEquipmentEntry` must expose: `equipmentItemId: number`, `penaltyAmount?: number`
  * `RentalDashboardMapper` is a pure static class — no Angular DI, no side effects
  * `RentalDashboardMapper.toListItem(r: RentalSummaryResponse, customer: CustomerResponse | null, equipmentNameMap: Map<number, string>): RentalListItem` sets:
    - `isActive = status === 'ACTIVE'`
    - `isDebt = status === 'DEBT'`
    - `isOverdue = r.overdueMinutes != null && r.overdueMinutes > 0`
    - `overdueMinutes` = `r.overdueMinutes` when `isOverdue` is `true`; `undefined` otherwise
    - `customerPhone = customer?.phone ?? ''`; `customerName` built from `customer?.firstName` and `customer?.lastName` (omitted when both are absent)
    - `equipmentNames` resolved by mapping each id in `r.equipmentIds` through `equipmentNameMap`; unknown IDs produce an empty string
  * `RentalDashboardMapper.toDetailState(r: RentalResponse, customer: CustomerResponse | null): Partial<RentalDetailState>` maps the API fields to the detail store-state shape:
    `status`, `customerId`, `startedAt`, `expectedReturnAt`, `paidDurationMinutes` ← `r.actualDurationMinutes`,
    `durationMinutes` ← `r.plannedDurationMinutes`, `customer` from the provided `CustomerResponse`
    (mapped to the `Customer` domain type), `equipmentItems` as `RentalEquipmentItem[]`
    (each `EquipmentItemResponse` mapped to an `EquipmentSearchItem` + `statusSlug`/`isReturned`);
    `isActive`, `isDebt` derived as in `toListItem`; `isOverdue` computed client-side
    (`isActive && startedAt + plannedDurationMinutes < now`) since `RentalResponse` does not
    carry `overdueMinutes`; `debtAmount` populated from `r.finalCost` only when `isDebt === true`
  * `RentalDashboardMapper.toReturnRequest(w: ReturnEquipmentWrite): ReturnRentalRequest`
    produces the shape expected by the generated `RentalsService`
  * `RentalListStore` is provided at the `RentalDashboardComponent` level (not `providedIn: 'root'`),
    so each visit to the route gets a fresh instance
  * `RentalListStore` state signals: `activeRentals: RentalListItem[]`,
    `historyRentals: RentalListItem[]`, `isLoadingActive: boolean`,
    `isLoadingHistory: boolean`
  * `RentalListStore` exposes `loadActive(): void` — three-step batch load:
    1. calls `RentalsService.getRentals({ page: 0, size: 100 }, 'ACTIVE')` to get rental summaries
    2. collects all unique `customerId` values and calls `CustomersService.getCustomersBatch(customerIds)` (existing generated service) to fetch phone and name in one request
    3. collects all unique equipment IDs from `response.items[].equipmentIds` and calls `EquipmentsCatalogueService.getBatchEquipments(equipmentIds)` (existing generated service) to fetch display names in one request
    4. applies `RentalDashboardMapper.toListItem(r, customerMap.get(r.customerId ?? ''), equipmentNameMap)` to each item
  * `RentalListStore` exposes `loadHistory(dateFrom: string, dateTo: string): void` — same
    three-step batch pattern as `loadActive`, fetching from
    `RentalsService.getRentals({ page: 0, size: 200 }, undefined, undefined, undefined, new Date(dateFrom), new Date(dateTo))`;
    the backend is responsible for applying day-boundary time suffixes
  * **Reuse existing types**: `Money` is the existing interface from `core/models/transaction.model.ts`; the mapper must use `makeMoney()` from `core/mappers/money.mapper.ts` when constructing `Money` values
  * **Reuse existing status helpers**: `mapRentalStatus(slug)` and `mapEquipmentItemStatus(slug)` from `core/models/rental.model.ts` are used by display COMPONENTS to resolve badge color and label from status slugs; they are NOT called inside the mapper itself
  * **Reuse existing cost type**: `RentalCostEstimate` from `core/models/rental-create.model.ts` is the existing cost calculation result type used in FR-09 — do NOT redefine it
  * **No API enrichment required for list fields**: `customerPhone`/`customerName` are fetched via `CustomersService.getCustomersBatch()` (already in `core/api/generated/services/`); `equipmentNames` are fetched via `EquipmentsCatalogueService.getBatchEquipments()` (already in `core/api/generated/services/`); `debtAmount` is a detail-only field and is not needed in the list
  * **API enrichment required — return endpoint**: `ReturnEquipmentRequest` (in `core/api/generated/`) currently lacks `discountPercent` and `specialPrice`; the backend return endpoint must be extended and `npm run generate:api` rerun; `ReturnEquipmentWrite.equipmentItemIds` maps to `ReturnEquipmentRequest.equipmentIds`
  * `RentalDashboardMapper` is a new static class added to `core/mappers/` as `rental-dashboard.mapper.ts` and exported from `core/mappers/index.ts`; it is separate from the existing `RentalMapper` class which handles the create-rental flow
  * All new interfaces must be exported from `core/models/index.ts`
  * Components must never import from `core/api/generated/` directly

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Mapper methods are pure and O(n) — no side effects or async work
* **Security/Compliance:** No PII logged; only rental IDs and event types emitted to the logger
* **Usability/Other:** All domain interfaces use `readonly` modifiers; `ReturnEquipmentWrite`
  uses mutable fields to allow incremental signal updates in the detail store

## 4. Acceptance Criteria (BDD)

**Scenario 1: toListItem marks overdue rental correctly**

* **Given** a `RentalSummaryResponse` with `overdueMinutes: 30` and `status: 'ACTIVE'`
* **When** `RentalDashboardMapper.toListItem(response, null, new Map())` is called
* **Then** the returned `RentalListItem` has `isOverdue: true` and `overdueMinutes: 30`

**Scenario 2: toListItem marks non-overdue rental correctly**

* **Given** a `RentalSummaryResponse` with `overdueMinutes: undefined` and `status: 'ACTIVE'`
* **When** `RentalDashboardMapper.toListItem(response, null, new Map())` is called
* **Then** the returned `RentalListItem` has `isOverdue: false` and `overdueMinutes` is
  `undefined`

**Scenario 3: toListItem resolves equipment names from the name map**

* **Given** a `RentalSummaryResponse` with `equipmentIds: [10, 20]` and an `equipmentNameMap` containing `10 → 'Trek FX3'` and `20 → 'Helmet S'`
* **When** `RentalDashboardMapper.toListItem(response, null, equipmentNameMap)` is called
* **Then** the returned `RentalListItem` has `equipmentNames: ['Trek FX3', 'Helmet S']`

**Scenario 4: toDetailState maps all nested equipment items**

* **Given** a `RentalResponse` with two `EquipmentItemResponse` entries, each having `equipmentId`, `equipmentUid`, and `status`
* **When** `RentalDashboardMapper.toDetailState(response, null)` is called
* **Then** the returned partial `RentalDetailState` has `equipmentItems` with two `RentalEquipmentItem` entries (each extending `EquipmentSearchItem`) with `statusSlug` and `isReturned` correctly populated

**Scenario 5: toReturnRequest maps ReturnEquipmentWrite correctly**

* **Given** a `ReturnEquipmentWrite` with `rentalId: 7`, `equipmentItemIds: [1, 2]`,
  `discountPercent: 10`
* **When** `RentalDashboardMapper.toReturnRequest(write)` is called
* **Then** the returned `ReturnRentalRequest` has the correct shape expected by the
  generated `RentalsService` with all provided fields and no `specialPrice` field

**Scenario 6: RentalListStore.loadActive populates activeRentals with enriched data**

* **Given** the store is instantiated; `RentalsService.getRentals` is stubbed to return two active rental summaries with `customerId` values; `CustomersService.getCustomersBatch` is stubbed to return matching customer records; `EquipmentsCatalogueService.getBatchEquipments` is stubbed to return matching equipment records
* **When** `loadActive()` is called
* **Then** `isLoadingActive` becomes `true` during the calls, then `false` after;
  `activeRentals` contains two `RentalListItem` entries with `customerPhone` and `equipmentNames` populated from the batch responses

**Scenario 7: RentalListStore.loadHistory applies date boundaries**

* **Given** the store is instantiated and `RentalsService.getRentals` is stubbed
* **When** `loadHistory('2026-05-14', '2026-05-14')` is called
* **Then** the generated service is called with `from: '2026-05-14'` and
  `to: '2026-05-14'`; `historyRentals` is populated with the mapped results

## 5. Out of Scope

* Domain types for rental creation (covered by REQ-RENTAL-CREATE FR-01)
* Customer domain types (covered by REQ-CUSTOMER-SECTION FR-01)
* Broken equipment penalty submission API shape — `BrokenEquipmentEntry[]` is a local
  client-only structure until the API endpoint is implemented
* Pagination or server-side sort parameters
