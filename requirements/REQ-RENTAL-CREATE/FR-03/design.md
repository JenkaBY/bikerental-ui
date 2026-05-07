# System Design: FR-03 — Route & Navigation Update

## 1. Architectural Overview

This story is a focused routing and navigation refactor within the `operator` SPA. The existing placeholder route `rental/new` (singular) is replaced with `rentals/new` (plural) to align with the rest of the operator route namespace. An optional `id` query parameter is added to support resuming a previously saved draft. The bottom navigation item for "New Rental" has its link target updated to match.

The change also connects the route to the `RentalStore.loadRental()` method introduced in FR-02: when `id` is present in the URL, the component resolves the draft before the stepper renders. Error handling for invalid or non-DRAFT IDs resets the flow and informs the operator via a snackbar notification.

Following the project-wide component decomposition principle, `RentalCreateComponent` is a thin smart shell (≤ 200 lines) whose template contains only `RentalStepperComponent`. All stepper chrome (step labels, forward/back navigation buttons, step-change logic) is encapsulated in `RentalStepperComponent`, which receives the active step index and the step validity flags as inputs and emits step-change events upward. The three step content components (`RentalStep1Component`, `RentalStep2Component`, `RentalStep3Component`) are projected into `RentalStepperComponent` via content slots.

## 2. Impacted Components

* **`operator` — Route Configuration (`app.routes.ts`):**
  The route entry for `rental/new` must be replaced with `rentals/new`. The route must declare support for the optional `id` query parameter. The wildcard redirect must remain in place so the old path continues to fall through to the root.

* **`operator` — `OperatorLayoutComponent` / `BottomNavComponent`:**
  The `routerLink` value for the "New Rental" bottom nav item must be updated from `rental/new` to `rentals/new`. No other changes to the navigation components.

* **`operator` — `RentalCreateComponent` (placeholder → route-aware, smart):**
  Must declare an `id` signal input bound to the `id` query parameter via `withComponentInputBinding()`. On component init, if `id` is present, calls `RentalStore.loadRental(id)`. On error, resets the store and shows a snackbar. Steps are not rendered until the resolution is complete. Declares `RentalStore` in its `providers` array. Contains only `RentalStepperComponent` in its template.

* **`operator` — new `RentalStepperComponent` (dumb):**
  Encapsulates the `MatStepper` chrome — step header labels, back/next button bar, and step-change events. Receives `activeStep` (Integer), `step1Valid` (Boolean), `step2Valid` (Boolean), `isSaving` (Boolean) as inputs. Emits `stepChange`, `next`, `back`, and `saveDraft` outputs. Projects `RentalStep1Component`, `RentalStep2Component`, and `RentalStep3Component` as content children into the appropriate step slots. Holds no business logic and injects no services.

## 3. Abstract Data Schema Changes

No new entities or attributes. The `id` query parameter is a transient URL value consumed once on component init; it is not persisted beyond the store's `id` signal.

## 4. Component Contracts & Payloads

* **Interaction: Browser URL -> `RentalCreateComponent`**
  * **Protocol:** Angular Router `withComponentInputBinding()`
  * **Payload Changes:** `id` (Integer, optional) is bound from the URL query string to a signal input on the component. When present, triggers `RentalStore.loadRental(id)`.

* **Interaction: `RentalCreateComponent` -> `RentalStore`**
  * **Protocol:** In-process method call
  * **Payload Changes:** `loadRental(id: number)` — see FR-02 contract; on error the component calls `reset()` and displays a snackbar.

## 5. Updated Interaction Sequence

**Happy path — navigating to `/rentals/new` (no id):**

1. Operator taps the "New Rental" bottom nav item.
2. Router navigates to `/rentals/new`.
3. `RentalCreateComponent` is instantiated; `id` input signal is `undefined`.
4. No `loadRental` call is made; the store uses default state.
5. Stepper renders with Step 1 active.

**Happy path — resuming a draft at `/rentals/new?id=42`:**

1. Operator taps "Resume" on the dashboard draft card (FR-08) or navigates directly.
2. Router navigates to `/rentals/new?id=42`.
3. `RentalCreateComponent` is instantiated; `id` input signal resolves to `42`.
4. `RentalStore.loadRental(42)` is called.
5. On success: draft data populates store signals; stepper advances to Step 2.
6. On error (not found / not DRAFT): `RentalStore.reset()` is called; snackbar notification is shown; stepper starts fresh on Step 1.

**Unhappy path — navigating to old route `/rental/new`:**

1. Router matches the wildcard route.
2. Operator is redirected to `/dashboard` (root operator route).

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Route is currently unprotected; an auth guard will be added in a later task (TASK002). No impact on this refactor.
* **Scale & Performance:** The `id` resolution is a single GET call on component init; no polling or caching is needed beyond the store's in-memory signal.
