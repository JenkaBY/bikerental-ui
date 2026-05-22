# User Story: FR-03 — Time Travel Store

## 1. Description

**As a** developer
**I want to** have a single injectable store that manages the SSE subscription to the server clock and exposes methods for setting and resetting the time
**So that** the toolbar display and the dialog can share the same live server-time signal without duplicating SSE logic

## 2. Context & Business Rules

* **Trigger:** The store initialises when it is first injected; the SSE connection is opened automatically at that point if `timeTravelEnabled` is `true`
* **Rules Enforced:**
  * The store is declared in `projects/shared/src/core/state/` and exported from `projects/shared/src/public-api.ts`
  * The store exposes a read-only signal `serverTime: Signal<ServerTime | null>`; the initial value is `null` (meaning no data received yet)
  * The SSE connection is established using the browser-native `EventSource` API pointed at `GET /api/dev/time`; it is not opened when `timeTravelEnabled` is `false`
  * Each incoming SSE message is parsed via `TimeTravelMapper.fromSseMessage()` and written to the signal
  * If the `EventSource` emits an `onerror` event, the signal retains its last known value; no crash, no reset to `null`
  * `setTime(date: Date): Observable<void>` calls `TimeTravelControllerService.setTime()` with `TimeTravelMapper.toSetRequest(date)` and maps the response to `void`
  * `resetTime(): Observable<void>` calls `TimeTravelControllerService.resetTime()` and maps the response to `void`
  * The store does not handle HTTP errors itself — the global `ErrorInterceptor` covers them
  * The `EventSource` connection is closed when the store is destroyed (Angular `DestroyRef` / `ngOnDestroy`)

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The SSE stream pushes one event per second; the signal update must not trigger unnecessary change detection in components using `OnPush` — the signal mechanism already handles this correctly
* **Security/Compliance:** The `/api/dev/time` endpoint is a developer-only utility; the store must not be initialised (and thus never opens a connection) when `timeTravelEnabled` is `false`
* **Usability/Other:** Consumers of the store must never need to import `SetTimeRequest`, `TimeResponse`, or any generated API model directly

## 4. Acceptance Criteria (BDD)

**Scenario 1: Signal starts at null**

* **Given** `timeTravelEnabled` is `true` and the store is injected
* **When** the store is first injected and no SSE event has arrived yet
* **Then** `serverTime()` returns `null`

**Scenario 2: Signal updates on SSE message**

* **Given** the `EventSource` is open and the server sends `{"instant":"2026-05-22T10:00:00Z","fixed":false}`
* **When** the `onmessage` handler fires
* **Then** `serverTime()` returns a `ServerTime` with the parsed `instant` and `fixed: false`

**Scenario 3: Signal retains value on SSE error**

* **Given** `serverTime()` has a non-null value
* **When** the `EventSource` fires an `onerror` event
* **Then** `serverTime()` still returns the last non-null value

**Scenario 4: No SSE connection when flag is false**

* **Given** `timeTravelEnabled` is `false`
* **When** the store is injected
* **Then** no `EventSource` is created and `serverTime()` remains `null`

**Scenario 5: setTime delegates to generated service**

* **Given** the store is initialised
* **When** `setTime(someDate)` is called
* **Then** `TimeTravelControllerService.setTime()` is invoked with `{ instant: someDate.toISOString() }`

**Scenario 6: resetTime delegates to generated service**

* **Given** the store is initialised
* **When** `resetTime()` is called
* **Then** `TimeTravelControllerService.resetTime()` is invoked

## 5. Out of Scope

* Automatic SSE reconnect with back-off strategy (browser `EventSource` natively reconnects)
* Caching or persisting the server time across page reloads
* Exposing the raw SSE `fixed` flag as a separate signal (consumers use `serverTime()?.fixed`)
