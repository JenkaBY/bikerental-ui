# System Design: FR-04 — Toolbar Time Display Widget

## 1. Architectural Overview

This story introduces `TimeTravelDisplayComponent`, a new leaf UI component in the shared library, and integrates it into the existing `AppToolbarComponent`. Because both Admin and Operator SPAs consume `AppToolbarComponent` from the shared library, the change propagates to both applications automatically without any per-SPA modification. The Gateway SPA is unaffected as it does not use the shared toolbar.

The toolbar layout is updated from a two-region (title + actions) flex model to a three-region model (title | time display | actions), where the left and right regions each claim equal flex space so that the centre region — occupied by the new display component — is visually centred regardless of content width.

The component is a pure read-only sink: it injects `TimeTravelStore`, reads the `serverTime` signal, formats the `instant` field as `dd/MM HH:mm:ss`, and delegates click events to `MatDialog` to open `TimeTravelDialogComponent`. It has no internal writable state and uses `OnPush` change detection.

---

## 2. Impacted Components

* **`TimeTravelDisplayComponent` (New — `projects/shared/src/shared/components/time-travel-display/`):**
  Introduced as a new standalone leaf component. Responsibilities:
  * Inject `TimeTravelStore` and read the `serverTime` signal.
  * Format `serverTime()?.instant` as `dd/MM HH:mm:ss` when non-null; display `--/-- --:--:--` when the signal is `null`.
  * Use fixed-width / tabular-nums styling so the toolbar does not reflow between the placeholder and live states.
  * On click, call `MatDialog.open(TimeTravelDialogComponent)`.
  * Apply `ChangeDetectionStrategy.OnPush`.
  * Be conditionally rendered by its parent via `@if (timeTravelEnabled)`; the component itself does not need to re-evaluate the flag.

* **`AppToolbarComponent` (Modified — `projects/shared/src/shared/components/app-toolbar/`):**
  Existing shared toolbar. Must be updated to:
  * Import and embed `TimeTravelDisplayComponent` in its template.
  * Restructure the toolbar flex layout to a three-region design (left flex-1 for title/toggle, centre for display, right flex-1 for actions) so the display appears in the visual centre.
  * Wrap the `TimeTravelDisplayComponent` embed in `@if (timeTravelEnabled)`, reading the flag from the injected `EnvironmentConfig` token.
  * The component's existing inputs and outputs (`title`, `showToggle`, `menuOpen`, `showLogout`, `showDesktopModeToggle`, `toggleSidebar`, `logout`) are unchanged.

* **`public-api.ts` (Shared Library Public API Barrel):**
  Must export `TimeTravelDisplayComponent` so it is available to any consumer that needs to reference it directly (e.g., for lazy-loaded dialog registration).

---

## 3. Abstract Data Schema Changes

No new domain entities or persistent state. The component consumes the `ServerTime` value object already defined in FR-02 via the `TimeTravelStore` signal from FR-03.

---

## 4. Component Contracts & Payloads

* **Interaction: `TimeTravelStore` → `TimeTravelDisplayComponent`**
  * **Protocol:** Angular signal read (`serverTime()`)
  * **Payload Changes:** `TimeTravelDisplayComponent` reads `serverTime: Signal<ServerTime | null>`. When non-null, it uses the `instant: Date` field for formatting. No data is written back to the store from this component.

* **Interaction: `TimeTravelDisplayComponent` → `TimeTravelDialogComponent`**
  * **Protocol:** `MatDialog.open()` (imperative, no data payload required for this FR)
  * **Payload Changes:** No `MAT_DIALOG_DATA` is injected into `TimeTravelDialogComponent` at open time from this component; the dialog reads `TimeTravelStore` directly (see FR-05).

* **Interaction: `AppToolbarComponent` → `TimeTravelDisplayComponent`**
  * **Protocol:** Angular component composition (host embeds child in template)
  * **Payload Changes:** No `@Input()` bindings are passed from `AppToolbarComponent` to `TimeTravelDisplayComponent`; the child injects its dependencies autonomously. The parent only controls whether the child is in the DOM via `@if`.

* **Interaction: `EnvironmentConfig` → `AppToolbarComponent`**
  * **Protocol:** Angular dependency injection
  * **Payload Changes:** `AppToolbarComponent` reads `timeTravelEnabled: boolean` from the injected environment token to drive the `@if` guard. This field was introduced in FR-01.

---

## 5. Updated Interaction Sequence

**Happy path — initial render, no SSE event yet:**

1. Admin or Operator SPA mounts its layout component, which renders `AppToolbarComponent`.
2. `AppToolbarComponent` evaluates `@if (timeTravelEnabled)`.
3. Flag is `true`; `TimeTravelDisplayComponent` is inserted into the DOM in the centre toolbar region.
4. `TimeTravelDisplayComponent` reads `TimeTravelStore.serverTime()` → `null`.
5. Component renders the placeholder string `--/-- --:--:--`.

**Happy path — SSE event received:**

1. `TimeTravelStore.serverTime` signal updates to a `ServerTime` value.
2. Angular's signal change detection schedules `TimeTravelDisplayComponent` for re-evaluation.
3. Component reads the updated `instant` field and formats it as `dd/MM HH:mm:ss`.
4. Toolbar re-renders the centre region with the formatted time string.

**Happy path — user clicks the display:**

1. User clicks `TimeTravelDisplayComponent`.
2. Component calls `MatDialog.open(TimeTravelDialogComponent)`.
3. `TimeTravelDialogComponent` opens as a modal overlay (FR-05 handles the dialog internals).

**Unhappy path — flag is false:**

1. `AppToolbarComponent` evaluates `@if (timeTravelEnabled)` → `false`.
2. `TimeTravelDisplayComponent` is never inserted into the DOM.
3. No signal reads, no `MatDialog` import, no SSE dependency is exercised in the toolbar.

---

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The time display widget exposes only the backend's current perceived clock — no user data, no credentials. The `@if (timeTravelEnabled)` guard in `AppToolbarComponent` ensures the widget and its click handler are not reachable when the feature is disabled in production, providing a secondary defence-in-depth layer beyond the service-level guard introduced in FR-03.

* **Scale & Performance:** `TimeTravelDisplayComponent` uses `ChangeDetectionStrategy.OnPush`. It is re-evaluated only when its signal dependency (`serverTime`) changes — once per second at most. The fixed-width placeholder string prevents layout thrashing when transitioning from the null state to the live display. No additional caching or debouncing is required.
