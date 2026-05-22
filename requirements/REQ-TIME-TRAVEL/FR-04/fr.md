# User Story: FR-04 — Toolbar Time Display Widget

## 1. Description

**As an** operator or admin user
**I want to** see the current server time displayed in the centre of the application toolbar
**So that** I am always aware of the time the backend is operating on, especially during testing scenarios where the clock may have been shifted

## 2. Context & Business Rules

* **Trigger:** The page loads and `AppToolbarComponent` is mounted; the display updates automatically every second as SSE events arrive
* **Rules Enforced:**
  * A new standalone component `TimeTravelDisplayComponent` is created in `projects/shared/src/shared/components/time-travel-display/`
  * The component reads `TimeTravelStore.serverTime` signal and formats the `instant` field as `dd/MM HH:mm:ss` using Angular's `DatePipe` or equivalent locale-aware formatting
  * Before the first SSE event (`serverTime()` is `null`) the component displays the placeholder string `--/-- --:--:--`
  * The component is placed in the **centre** of `AppToolbarComponent` — visually between the title area on the left and any right-side action items
  * To achieve centred positioning, the toolbar layout must be adjusted so the title and the right-side actions each occupy equal flex space and the time display sits in the middle
  * Clicking anywhere on the `TimeTravelDisplayComponent` opens `TimeTravelDialogComponent` via `MatDialog`
  * The entire component is conditionally rendered with `@if (timeTravelEnabled)` — it must not appear in the DOM at all when the flag is `false`
  * `AppToolbarComponent` in the `shared` library is updated to embed `TimeTravelDisplayComponent`; because both admin and operator use this shared toolbar, both apps automatically show the widget
  * The gateway app is not affected (it does not use the shared `AppToolbarComponent`)
  * The component uses `ChangeDetectionStrategy.OnPush`

## 3. Non-Functional Requirements (NFRs)

* **Performance:** The signal-driven update (one per second) must not degrade toolbar rendering; `OnPush` ensures only the display component re-renders
* **Security/Compliance:** No sensitive data is displayed; the time value comes exclusively from the SSE stream
* **Usability/Other:** The `--/-- --:--:--` placeholder must be fixed-width so the toolbar does not shift layout when real data arrives; a monospace or tabular-nums font style is recommended

## 4. Acceptance Criteria (BDD)

**Scenario 1: Placeholder shown before first SSE event**

* **Given** `timeTravelEnabled` is `true` and the toolbar has rendered
* **When** no SSE event has been received yet
* **Then** the toolbar displays `--/-- --:--:--` in the centre position

**Scenario 2: Live time shown after SSE event**

* **Given** `serverTime()` returns `{ instant: Date('2026-05-22T10:30:45Z'), fixed: false }`
* **When** the toolbar renders
* **Then** the centre of the toolbar shows `22/05 10:30:45` (or the locale-equivalent `dd/MM HH:mm:ss` format)

**Scenario 3: Widget absent when flag is false**

* **Given** `timeTravelEnabled` is `false`
* **When** the toolbar renders
* **Then** no time display element exists in the DOM

**Scenario 4: Click opens the dialog**

* **Given** the time display is visible
* **When** the user clicks on it
* **Then** `TimeTravelDialogComponent` opens as a `MatDialog`

**Scenario 5: Both admin and operator show the widget**

* **Given** `timeTravelEnabled` is `true`
* **When** a user navigates to any admin page or any operator page
* **Then** the server time is visible in the toolbar of both applications

## 5. Out of Scope

* Visual differentiation between `fixed: true` and `fixed: false` states
* Tooltip or popover showing full ISO timestamp on hover
* Gateway (landing page) toolbar modifications
* Keyboard shortcut to open the dialog
