# System Design: FR-02 — Server Time Domain Model & Mapper

## 1. Architectural Overview

This story establishes the domain layer artefacts for the time-travel feature by introducing a `ServerTime` domain model and a `TimeTravelMapper` static class. Both artefacts live entirely within the shared library and follow the established three-layer data pipeline: the auto-generated `SetTimeRequest` API type from `core/api/generated/` is referenced only inside the mapper; all components and services above that layer interact exclusively with `ServerTime` and plain `Date` values.

No new infrastructure, services, or UI components are introduced by this story. The mapper is a pure data-translation boundary; it has no Angular DI, performs no I/O, and carries no state.

---

## 2. Impacted Components

* **`core/models/` barrel (Shared Domain Models):** Must be extended with a new `ServerTime` interface and its export added to the `index.ts` barrel so consumers can import it from a single path.

* **`core/mappers/` (Shared Mapper Layer):** Must receive a new pure static class `TimeTravelMapper` with two methods. The mapper imports only from `core/api/generated/models` (for `SetTimeRequest`) and `core/models` (for `ServerTime`). It is exported from the mappers barrel and re-exported from `public-api.ts`.

* **`public-api.ts` (Shared Library Public API Barrel):** Must be updated to re-export `ServerTime` from `core/models` and `TimeTravelMapper` from `core/mappers` so downstream projects can consume them through a single library import path.

---

## 3. Abstract Data Schema Changes

* **Entity: `ServerTime`**
  * **Attributes Added:**
    * `instant` (Date) — the backend's current perceived clock instant, converted from the ISO-8601 UTC string received in the SSE event payload.
    * `fixed` (Boolean) — `true` when the server clock has been overridden by a time-travel call; `false` when the server is running on real time.
  * **Relations:** None — this is a value object with no relations to other domain entities.

* **Implicit API type reference: `SetTimeRequest`** (already generated; not modified)
  * Shape: `{ instant: string }` — the ISO-8601 string representation used when sending a time-travel mutation to the backend. The mapper produces this type but components never import it directly.

---

## 4. Component Contracts & Payloads

* **Interaction: `TimeTravelMapper` → `TimeTravelStore` (consumer — FR-03)**
  * **Protocol:** Direct static method call (no network, no DI)
  * **Payload Changes:**
    * `fromSseMessage(raw: string): ServerTime` — input is the raw JSON string from an SSE `data:` field; output is a `ServerTime` value object. The `instant` JSON field (ISO-8601 UTC string) is converted to a `Date`.
    * `toSetRequest(date: Date): SetTimeRequest` — input is a `Date`; output is a `SetTimeRequest` with `instant` set to `date.toISOString()`. This is the only site in the codebase where `SetTimeRequest` is instantiated.

* **Interaction: `core/models/ index.ts` barrel → all consumers**
  * **Protocol:** TypeScript module export
  * **Payload Changes:** `ServerTime` is added as a named export. Existing exports are unchanged.

---

## 5. Updated Interaction Sequence

**Scenario: Parsing an incoming SSE message**

1. `TimeTravelStore` (FR-03) receives a raw SSE `data:` string from the `EventSource`.
2. `TimeTravelStore` calls `TimeTravelMapper.fromSseMessage(raw)`.
3. `TimeTravelMapper` calls `JSON.parse(raw)`, reads the `instant` field as an ISO-8601 string, converts it via `new Date(instant)`, and reads the `fixed` boolean field.
4. `TimeTravelMapper` returns a `ServerTime` value object.
5. `TimeTravelStore` writes the result into its `serverTime` signal.

**Scenario: Producing an outgoing set-time request**

1. `TimeTravelStore.setTime(date: Date)` is called by `TimeTravelDialogComponent` (FR-05).
2. `TimeTravelStore` calls `TimeTravelMapper.toSetRequest(date)`.
3. `TimeTravelMapper` returns `{ instant: date.toISOString() }` as a `SetTimeRequest`.
4. `TimeTravelStore` passes the `SetTimeRequest` to `TimeTravelControllerService.setTime()`.

---

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The mapper operates on developer-utility data only (server clock values). No PII is processed or stored. The mapper has no network access and cannot be exploited as an injection point.

* **Scale & Performance:** Both mapper methods are synchronous O(1) operations with no allocations beyond a single object literal. There is no caching requirement. The one-per-second SSE update rate is handled at the service layer (FR-03); the mapper itself imposes negligible overhead.
