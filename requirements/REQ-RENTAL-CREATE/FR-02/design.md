# System Design: FR-02 — Rental Signal Store

## 1. Architectural Overview

This story introduces `RentalStore`, a feature-scoped signal-based state container provided at the `RentalCreateComponent` level (not root). It serves as the single source of truth for all three steps of the Create Rental flow, encapsulating draft accumulation, reactive cost recalculation, draft persistence, and rental activation. The store is the only component in the operator project that directly calls the generated API services for rental operations.

The store orchestrates two distinct async operation families — cost calculation (debounced reactive pipeline) and draft save / rental activation (imperative mutations) — while exposing only clean domain types and computed signals to step components. No step component holds any state independently; all reads and writes go through the store's public surface.

The `specialTariffId` is **not** resolved by `RentalStore`. It is a stable, session-wide value resolved once when the operator application bootstraps and cached in the root-scoped `TariffStore` (`providedIn: 'root'`). `RentalStore` reads it as a signal from `TariffStore` at the point of cost calculation and request construction.

## 2. Impacted Components

* **`operator` (Operator SPA) — `RentalCreateComponent` (placeholder → enhanced):**
  Must now declare `RentalStore` in its `providers` array so each route visit creates a fresh store instance. The component itself acts as the orchestration host; it does not read store state directly beyond forwarding the store reference to child step components.

* **`shared` (Shared Library) — new `RentalStore`:**
  New injectable service class carrying the full signal state, computed signals, reactive cost pipeline, and mutation methods described below. Lives in `projects/shared/src/core/state/` and is exported from `public-api.ts`.

* **`shared` (Shared Library) — `TariffStore` (existing, `providedIn: 'root'`):**
  Must be extended to resolve and cache the special tariff ID on application init (via `provideAppInitializer()`). Exposes a new `specialTariffId` signal (`Integer | null`). `RentalStore` reads this signal; no resolution logic lives inside `RentalStore`.

## 3. Abstract Data Schema Changes

* **In-memory store state (no persistence):**
  * `id` (Integer | null) — persisted rental ID once draft is created on the backend
  * `customer` (Customer | null)
  * `durationMinutes` (Integer, default 30)
  * `equipmentItems` (EquipmentSearchItem[ ], default [ ])
  * `discountPercent` (Integer | null, default null)
  * `specialPriceEnabled` (Boolean, default false)
  * `specialPrice` (Decimal | null, default null)

* **Derived / computed (not stored):**
  * `costEstimate` — `RentalCostEstimate | null`
  * `projectedBalance` — `Decimal | null`
  * `canProceedFromStep2` — Boolean
  * `isBalanceSufficient` — Boolean
  * `isSaving` — Boolean (loading flag)
  * `isActivating` — Boolean (loading flag)

## 4. Component Contracts & Payloads

* **Interaction: `RentalStore` -> `TariffsService` (generated)**
  * **Protocol:** HTTP GET (reactive pipeline, debounced 300 ms)
  * **Payload Changes:** Sends `CostCalculationRequest` built by `RentalMapper.toCostCalculationRequest()`; receives `CostCalculationResponse` mapped via `RentalMapper.fromCostResponse()` into `costEstimate`

* **Interaction: `RentalStore` -> `RentalsService` (generated)**
  * **Protocol:** HTTP POST (draft creation), HTTP PATCH (draft update), HTTP POST (rental activation), HTTP GET (draft load)
  * **Payload Changes:**
    * `POST /api/rentals/draft` — no body; returns `{ id: Integer }`
    * `PATCH /api/rentals/{id}` — body: `{ customerId, equipmentIds, duration }`
    * `POST /api/rentals` — body: `CreateRentalRequest` from `RentalMapper.toCreateRequest()`; returns `{ rentalId: Integer }`
    * `GET /api/rentals/{id}` — returns full rental; fields mapped back into state signals

* **Interaction: `TariffStore` (root) -> `EquipmentTypeStore` / `TariffsService` (generated)**
  * **Protocol:** Signal read (equipment types) + HTTP GET (`/api/tariffs/active?equipmentType={slug}`), executed once during application bootstrap via `provideAppInitializer()`
  * **Payload Changes:** Reads equipment types to find the one with `isForSpecialTariff = true`, then calls `GET /api/tariffs/active?equipmentType={slug}`; stores the first returned SPECIAL tariff ID in the root `TariffStore.specialTariffId` signal

* **Interaction: `RentalStore` -> `TariffStore` (root)**
  * **Protocol:** In-process signal read
  * **Payload Changes:** `RentalStore` reads `TariffStore.specialTariffId` when building `CostCalculationRequest` and `CreateRentalRequest`; no HTTP call is made by `RentalStore` for this value

## 5. Updated Interaction Sequence

**Happy path — cost recalculation:**

1. Operator mutates `durationMinutes`, `equipmentItems`, `discountPercent`, `specialPrice`, or `specialPriceEnabled` in the store.
2. Reactive effect detects the change; if `equipmentItems` is empty, `costEstimate` is set to `null` and no API call is made.
3. After 300 ms debounce, `TariffsService.calculateCost()` is called with `CostCalculationRequest`; any in-flight previous call is cancelled.
4. Response is mapped to `RentalCostEstimate` and stored in `costEstimate`; `projectedBalance` and `canProceedFromStep2` are recomputed.

**Happy path — save draft:**

1. `save()` is called; `isSaving` is set to `true`.
2. If `id` is `null`: `POST /api/rentals/draft` is called; returned `id` is stored.
3. `PATCH /api/rentals/{id}` is called with current `customerId`, `equipmentIds`, `duration`; on success `isSaving` is reset to `false`.
4. On error: `isSaving` is reset to `false`; error propagates to the caller component for snackbar display.

**Happy path — activate rental:**

1. `activateRental()` is called; `isActivating` is set to `true`.
2. `RentalMapper.toCreateRequest()` builds the request payload.
3. `POST /api/rentals` is called; on success `rentalId` is stored, `isActivating` is reset, and the caller navigates to `/dashboard`.
4. On error: `isActivating` is reset; error propagates for snackbar display.

**Happy path — load draft:**

1. `loadRental(id)` is called with the draft ID.
2. `GET /api/rentals/{id}` is called; response fields are mapped back into all state signals; stepper advances to Step 2.
3. On error (not found / not DRAFT status): `reset()` is called; error propagates for snackbar display.

**Session startup — special tariff resolution (once per operator sign-in, handled by `TariffStore`):**

1. Application bootstraps; `provideAppInitializer()` triggers `TariffStore.resolveSpecialTariff()`.
2. `TariffStore` reads `EquipmentTypeStore` to find the type where `isForSpecialTariff = true`.
3. `GET /api/tariffs/active?equipmentType={slug}` is called once.
4. The first returned SPECIAL tariff's `id` is stored in `TariffStore.specialTariffId` signal and remains cached for the session.
5. `RentalStore` reads `TariffStore.specialTariffId` as a signal whenever it builds a cost or create request — no further HTTP call is made.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII is logged; only rental IDs and event names are emitted to the logger service.
* **Scale & Performance:** Cost calculation pipeline uses `debounceTime(300ms)` and `switchMap` to cancel in-flight requests on new inputs. `isSaving` and `isActivating` signals disable action buttons during network calls to prevent double-submission.
