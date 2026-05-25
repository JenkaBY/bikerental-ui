# User Story: FR-02 — Server Time Domain Model & Mapper

## 1. Description

**As a** developer
**I want to** have a clean domain model for server time and a mapper that converts raw SSE messages and outgoing date values
**So that** components and services work exclusively with typed domain objects and are fully decoupled from the auto-generated API shapes

## 2. Context & Business Rules

* **Trigger:** Any component or service that needs to read or write the server time value
* **Rules Enforced:**
  * A `ServerTime` interface is declared in `projects/shared/src/core/models/` and exported from its `index.ts` barrel
  * `ServerTime` has exactly two fields: `instant: Date` and `fixed: boolean`
  * `fixed: true` means the server clock has been overridden by a time-travel call; `fixed: false` means it is running at real time
  * A `TimeTravelMapper` pure static class is declared in `projects/shared/src/core/mappers/`
  * `TimeTravelMapper.fromSseMessage(raw: string): ServerTime` — parses a raw SSE `data:` JSON string into a `ServerTime`; the `instant` field in the JSON is an ISO-8601 UTC string that maps to a JavaScript `Date`
  * `TimeTravelMapper.toSetRequest(date: Date): SetTimeRequest` — produces a `SetTimeRequest` object (`{ instant: string }`) by calling `date.toISOString()`
  * `TimeTravelMapper` has no Angular DI, no side effects, and no imports from outside `core/api/generated/models` and `core/models/`
  * Components and services must never import `SetTimeRequest` or any generated API type directly; they use `ServerTime` and `Date` values only

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — pure synchronous data mapping, no I/O
* **Security/Compliance:** No PII in the time values; no persistence in the mapper layer
* **Usability/Other:** Both the model and mapper must be exported from their respective barrel files so that a single import path is sufficient for consumers

## 4. Acceptance Criteria (BDD)

**Scenario 1: fromSseMessage parses a valid SSE payload**

* **Given** a raw SSE data string `'{"instant":"2026-05-22T05:03:52.442739805Z","fixed":false}'`
* **When** `TimeTravelMapper.fromSseMessage(raw)` is called
* **Then** the result is a `ServerTime` with `fixed: false` and `instant` equal to the `Date` represented by `2026-05-22T05:03:52.442739805Z`

**Scenario 2: fromSseMessage handles fixed: true**

* **Given** a raw SSE data string with `"fixed":true`
* **When** `TimeTravelMapper.fromSseMessage(raw)` is called
* **Then** the result has `fixed: true`

**Scenario 3: toSetRequest converts a Date to SetTimeRequest**

* **Given** a JavaScript `Date` object representing `2026-06-01T10:00:00.000Z`
* **When** `TimeTravelMapper.toSetRequest(date)` is called
* **Then** the result is `{ instant: "2026-06-01T10:00:00.000Z" }`

**Scenario 4: ServerTime is exported from the models barrel**

* **Given** the barrel file `core/models/index.ts`
* **When** a developer imports from it
* **Then** `ServerTime` is available as a named export

## 5. Out of Scope

* Timezone conversion or locale-aware date formatting (handled in the display component — FR-04)
* Validation of the ISO string format beyond what `new Date()` provides
* Mapping SSE event types other than the time payload
