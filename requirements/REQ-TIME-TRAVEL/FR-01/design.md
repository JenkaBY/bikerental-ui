# System Design: FR-01 — Feature Flag Configuration

## 1. Architectural Overview

This story introduces a single boolean control surface — `timeTravelEnabled` — into the shared environment configuration layer. The flag is the exclusive gate for the entire time-travel feature: all UI components, services, and SSE connections must be conditional on its value. Because the shared library's environment files are already the canonical location for configuration values consumed by all three SPAs (`gateway`, `admin`, `operator`), adding the flag here requires no structural change to the component topology.

The production environment file receives a build-time placeholder literal instead of a boolean literal. The CI/CD pipeline (see FR-06) replaces that placeholder before compilation, producing a proper boolean in the compiled bundle. This design keeps the source of truth in one file per environment and preserves the fail-fast behaviour already established for `apiUrl`.

---

## 2. Impacted Components

* **`EnvironmentConfig` (Shared Environment Configuration):** Must be extended with a new field `timeTravelEnabled: boolean`. The development environment file (`environment.ts`) sets the value to `true`. The production environment file (`environment.prod.ts`) stores the expression `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')` as its value. When the CI/CD pipeline replaces the placeholder string with `true` or `false`, the expression evaluates to the correct boolean. When the placeholder is **not** replaced (e.g., the variable is absent from CI), the expression evaluates to `false` at compile time — the feature is silently disabled and the build succeeds.

* **`AppToolbarComponent` (Shared Toolbar):** Must read the `timeTravelEnabled` flag from the injected environment token and wrap the time-travel widget slot in a structural conditional (`@if`) so the widget is entirely absent from the DOM when the flag is `false`. This is the only consuming component in scope for this story; subsequent FRs (FR-04) define the widget itself.

---

## 3. Abstract Data Schema Changes

* **Configuration Object: `EnvironmentConfig`**
  * **Attributes Added:** `timeTravelEnabled` (Boolean) — controls whether the time-travel UI and SSE service are active. Value is `true` in development, resolved to `true` or `false` in production via CI/CD substitution.
  * No new entities or relational changes.

---

## 4. Component Contracts & Payloads

* **Interaction: `EnvironmentConfig` → `AppToolbarComponent`**
  * **Protocol:** Angular dependency injection (injection token / `InjectionToken`)
  * **Payload Changes:** The environment object injected into `AppToolbarComponent` gains the `timeTravelEnabled: boolean` field. The toolbar reads this field at render time to conditionally include or exclude the time-travel widget slot.

* **Interaction: `EnvironmentConfig` → `TimeTravelStore` (future — FR-03)**
  * **Protocol:** Angular dependency injection
  * **Payload Changes:** The same `timeTravelEnabled` field will be read by `TimeTravelStore` to decide whether to open an SSE connection. Defined here as the authoritative location; wired in FR-03.

---

## 5. Updated Interaction Sequence

**Happy path — development build:**

1. Angular bootstraps the Admin or Operator SPA with `environment.ts` compiled in.
2. `EnvironmentConfig` injection token resolves `timeTravelEnabled: true`.
3. `AppToolbarComponent` evaluates the flag and renders the time-travel widget slot.

**Happy path — production build with flag set to `false`:**

1. CI/CD pipeline replaces `BIKE_TIME_TRAVEL_PLACEHOLDER` with `false` in `environment.prod.ts` before compilation.
2. Angular bootstraps with the production environment; `timeTravelEnabled` resolves to `false`.
3. `AppToolbarComponent` evaluates the flag; the `@if` block is not entered; no time-travel DOM is emitted.

**Unhappy path — placeholder not replaced (CI variable absent):**

1. `BIKE_TIME_TRAVEL_ENABLED` is absent from repository variables; the `sed` step leaves `BIKE_TIME_TRAVEL_PLACEHOLDER` in the file.
2. The expression `('BIKE_TIME_TRAVEL_PLACEHOLDER' === 'true')` evaluates to `false` at compile time.
3. The TypeScript compiler sees a valid `boolean` value; the build succeeds.
4. The deployed SPA has `timeTravelEnabled: false`; the time-travel widget is absent.

---

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The flag is the only access barrier for the `/api/dev/time` developer endpoint. Setting `timeTravelEnabled: false` in production ensures the endpoint is never called and the UI is never rendered, preventing accidental time manipulation by end users. No additional authentication or authorisation layer is required for this feature.

* **Scale & Performance:** The flag is resolved once at bootstrap via Angular's DI system; there is no runtime overhead. No caching, queuing, or concurrency considerations apply.
