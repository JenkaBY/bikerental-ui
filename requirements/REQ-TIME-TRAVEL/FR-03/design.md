# System Design: FR-03 — Time Travel Store

## 1. Architectural Overview

This story introduces `TimeTravelStore`, the single stateful orchestrator for the time-travel feature within the shared library. The store owns the SSE lifecycle, maintains the reactive `serverTime` signal consumed by the toolbar display widget and the dialog, and delegates all outgoing HTTP mutations to the auto-generated `TimeTravelControllerService`. It sits in the `core/state/` layer of the shared library — above `core/api/generated/` and `core/mappers/` but below the `shared/components/` UI layer.

The store is conditionally initialised: it opens an `EventSource` connection only when `timeTravelEnabled` is `true`. When the flag is `false`, the store is inert — it exposes the same public signal (permanently `null`) but never creates a network connection. The browser's native `EventSource` reconnect behaviour handles transient disconnects without additional logic.

---

## 2. Impacted Components

* **`TimeTravelStore` (New — `projects/shared/src/core/state/`):** Introduced as a new injectable store. Responsibilities:
  * On initialisation (when `timeTravelEnabled` is `true`), open an `EventSource` pointed at `GET /api/dev/time`.
  * On each `onmessage` event, call `TimeTravelMapper.fromSseMessage()` and write the result into the internal `serverTime` writable signal.
  * On `onerror`, retain the last signal value without resetting.
  * On destroy (`DestroyRef` / `ngOnDestroy`), close the `EventSource`.
  * Expose `setTime(date: Date): Observable<void>` — delegates to `TimeTravelControllerService.setTime()` with the mapper-produced request object.
  * Expose `resetTime(): Observable<void>` — delegates to `TimeTravelControllerService.resetTime()`.

* **`TimeTravelControllerService` (Existing — `projects/shared/src/core/api/generated/services/`):** Already generated; no modifications required. `TimeTravelStore` injects and calls it but does not wrap or re-export it.

* **`TimeTravelMapper` (Existing — introduced in FR-02):** Called by `TimeTravelStore` for both `fromSseMessage` and `toSetRequest`. No changes to the mapper itself.

* **`public-api.ts` (Shared Library Public API Barrel):** Must be updated to export `TimeTravelStore` so that Admin and Operator app-level `providers` arrays can reference it.

---

## 3. Abstract Data Schema Changes

* **No new persistent entities.** The `serverTime` signal is in-memory, reset on page reload.
* **Signal state:**
  * `serverTime: Signal<ServerTime | null>` — initial value `null`; updated to a `ServerTime` value object on each SSE message. Null indicates no event received yet (or `timeTravelEnabled: false`).

---

## 4. Component Contracts & Payloads

* **Interaction: `bikerental-backend` → `TimeTravelStore`**
  * **Protocol:** SSE (`EventSource`, `GET /api/dev/time`)
  * **Payload Changes (incoming):** Server pushes `{"instant":"<ISO-8601 UTC>","fixed":<boolean>}` approximately once per second. The `instant` field is parsed to a `Date`; `fixed` is read as a boolean. Both are composed into a `ServerTime` value object via `TimeTravelMapper.fromSseMessage()`.

* **Interaction: `TimeTravelStore` → `bikerental-backend` (set time)**
  * **Protocol:** REST (PUT `/api/dev/time` via `TimeTravelControllerService`)
  * **Payload Changes:** Request body: `{ instant: string }` (ISO-8601 UTC). Response: void (204). The caller (`TimeTravelDialogComponent`, FR-05) receives an `Observable<void>` and handles the success path.

* **Interaction: `TimeTravelStore` → `bikerental-backend` (reset time)**
  * **Protocol:** REST (DELETE `/api/dev/time` via `TimeTravelControllerService`)
  * **Payload Changes:** No request body. Response: void (204). Same `Observable<void>` pattern.

* **Interaction: `TimeTravelStore` → `TimeTravelDisplayComponent` / `TimeTravelDialogComponent` (consumers)**
  * **Protocol:** Angular signal read (`serverTime()`)
  * **Payload Changes:** Consumers read `serverTime: Signal<ServerTime | null>`. No method calls needed for the display; dialog calls `setTime()` and `resetTime()` imperatively.

---

## 5. Updated Interaction Sequence

**Happy path — SSE stream active:**

1. Admin or Operator SPA bootstraps; `TimeTravelStore` is injected for the first time.
2. `TimeTravelStore` checks `timeTravelEnabled`; value is `true`.
3. `TimeTravelStore` constructs an `EventSource` targeting `{apiUrl}/api/dev/time`.
4. Browser establishes the SSE connection to the backend.
5. Backend emits `{"instant":"…","fixed":false}` every second.
6. `TimeTravelStore.onmessage` fires; `TimeTravelMapper.fromSseMessage()` converts the payload.
7. `serverTime` signal is updated to the new `ServerTime` value.
8. `TimeTravelDisplayComponent` (FR-04) reads the updated signal and re-renders the formatted time.

**Unhappy path — SSE error:**

1. The `EventSource` fires `onerror` (e.g., network interruption).
2. `TimeTravelStore` does not reset `serverTime`; it retains the last received value.
3. The browser's native `EventSource` reconnect logic attempts to re-establish the connection automatically.
4. Once reconnected, normal SSE message processing resumes from step 5 above.

**Happy path — flag disabled:**

1. SPA bootstraps with `timeTravelEnabled: false`.
2. `TimeTravelStore` is injected; the `EventSource` is never created.
3. `serverTime` signal remains permanently `null`.
4. `AppToolbarComponent` (FR-04) does not render the widget because the `@if (timeTravelEnabled)` guard prevents it; the store is effectively dormant.

**Happy path — setTime called:**

1. `TimeTravelDialogComponent` (FR-05) calls `TimeTravelStore.setTime(selectedDate)`.
2. `TimeTravelStore` calls `TimeTravelMapper.toSetRequest(selectedDate)` → `{ instant: "…" }`.
3. `TimeTravelStore` calls `TimeTravelControllerService.setTime({ instant: "…" })`.
4. Backend responds 204; Observable completes.
5. `TimeTravelStore` returns `void`; dialog closes (handled in FR-05).

**Happy path — resetTime called:**

1. `TimeTravelDialogComponent` calls `TimeTravelStore.resetTime()`.
2. `TimeTravelStore` calls `TimeTravelControllerService.resetTime()`.
3. Backend responds 204; Observable completes.
4. `TimeTravelStore` returns `void`; dialog closes (handled in FR-05).

**Unhappy path — HTTP error on setTime / resetTime:**

1. Backend returns a 4xx/5xx response.
2. The global `ErrorInterceptor` intercepts the error and surfaces it via `MatSnackBar`.
3. `TimeTravelStore` does not catch the error; it propagates through the Observable.
4. The dialog remains open (handled in FR-05 by not subscribing to the close path on error).

---

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** `TimeTravelStore` must never be initialised in a production context (`timeTravelEnabled: false`) and must never open an `EventSource` connection in that case. The restriction is enforced at construction time by reading the environment flag. There is no additional authentication requirement for the `/api/dev/time` endpoint beyond the application's existing HTTP interceptor chain.

* **Scale & Performance:** The SSE stream delivers one event per second. The `serverTime` signal uses Angular's fine-grained reactivity model; only components that read the signal in their template are scheduled for re-evaluation, and only if the signal value changes. With `OnPush` change detection on all consuming components, no unnecessary DOM updates occur. The `EventSource` connection is a single persistent HTTP/1.1 long-polling connection; it does not impact other API calls.
