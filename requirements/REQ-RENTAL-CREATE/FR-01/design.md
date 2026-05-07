# System Design: FR-01 — Rental Creation Domain Types & Mapper

## 1. Architectural Overview

This story introduces the foundational data layer for the Create Rental flow. It adds three new domain interfaces (`RentalWrite`, `RentalCostEstimate`, `EquipmentSearchItem`) and two new pure-static mapper classes (`RentalMapper`, `EquipmentSearchItemMapper`) to the `shared` library. These types sit exclusively in the `core/models/` and `core/mappers/` layers, creating a clean boundary between the auto-generated API contract and all operator-facing components.

No existing components or services are modified. The change is entirely additive: new interfaces are appended to `core/models/` and exported through the barrel, and the new mapper classes join the existing mapper set in `core/mappers/`. Components in the `operator` project that will be built in subsequent FRs import only from this domain layer.

## 2. Impacted Components

* **`shared` (Shared Library):**
  Must be extended with three new domain model interfaces (`RentalWrite`, `RentalCostEstimate`, `EquipmentSearchItem`) in `core/models/`, two new mapper classes (`RentalMapper`, `EquipmentSearchItemMapper`) in `core/mappers/`, and updated barrel exports in `core/models/index.ts` and `public-api.ts`.

## 3. Abstract Data Schema Changes

* **Entity: `RentalWrite`** (new, mutable — used as draft accumulator in signal store)
  * **Attributes:** `customerId` (String), `equipmentIds` (Integer[ ]), `durationMinutes` (Integer), `discountPercent` (Integer, optional), `specialTariffId` (Integer, optional), `specialPrice` (Decimal, optional), `operatorId` (String)

* **Entity: `RentalCostEstimate`** (new, read-only — result of cost calculation API)
  * **Attributes:** `subtotal` (Decimal), `totalCost` (Decimal), `discountAmount` (Decimal, optional), `discountPercent` (Integer, optional), `specialPricingApplied` (Boolean)
  * **Nested collection:** `equipmentBreakdowns` — each entry: `equipmentType` (String), `tariffId` (Integer), `itemCost` (Decimal)

* **Entity: `EquipmentSearchItem`** (new, read-only — flattened view of available equipment)
  * **Attributes:** `id` (Integer), `uid` (String), `model` (String), `typeSlug` (String), `statusSlug` (String)

## 4. Component Contracts & Payloads

* **Interaction: `RentalMapper` -> `CreateRentalRequest` (generated)**
  * **Protocol:** Pure in-process function call (no I/O)
  * **Payload Changes:**
    * `toCreateRequest(draft: RentalWrite)` — maps `durationMinutes` → `duration`; omits `discountPercent`, `specialTariffId`, `specialPrice` when `undefined`
    * `toCostCalculationRequest(draft: Partial<RentalWrite>, equipmentTypes: string[])` — maps `durationMinutes` → `plannedDurationMinutes`; maps `equipmentTypes` → `equipments: [{ equipmentType }]`; forwards `discountPercent`, `specialTariffId`, `specialPrice`
    * `fromCostResponse(response: CostCalculationResponse)` — flattens `discount.percent` → `discountPercent`, `discount.amount` → `discountAmount`; copies `subtotal`, `totalCost`, `specialPricingApplied`; maps `equipmentBreakdowns`

* **Interaction: `EquipmentSearchItemMapper` -> `EquipmentResponse` (generated)**
  * **Protocol:** Pure in-process function call (no I/O)
  * **Payload Changes:**
    * `fromResponse(r: EquipmentResponse)` — maps `r.type` → `typeSlug`, `r.status` → `statusSlug`; copies `id`, `uid`, `model`

## 5. Updated Interaction Sequence

1. A downstream component or store requests a typed representation of a rental draft.
2. The component reads from `RentalWrite` signals (set by mutation methods in `RentalStore`, FR-02).
3. Before an API call, `RentalMapper.toCreateRequest(draft)` or `RentalMapper.toCostCalculationRequest(draft, types)` is invoked to produce the generated-API request shape.
4. The generated API service sends the request to the backend.
5. The backend response is passed to `RentalMapper.fromCostResponse()` or `EquipmentSearchItemMapper.fromResponse()` to produce a domain object.
6. The domain object is stored in a signal and consumed by templates — no raw API types reach the component layer.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII is persisted or logged in the mapper layer; data passes through without storage.
* **Scale & Performance:** All mapper methods are synchronous and allocation-free beyond object construction; no caching or async handling required.
