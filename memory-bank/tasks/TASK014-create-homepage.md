# [TASK014] Create home page with links to Operator and Administrator dashboards

**Status:** In Progress  
**Added:** 2026-03-09  
**Updated:** 2026-03-09

## Original Request

Create a home page which will contain references to 2 dashboards: operator and administrator.

## Thought Process

The application currently has separate route groups and layouts for operator and admin (TASK003 and TASK004). A small, focused home page will help users land and choose the appropriate area. The home page should be lightweight, accessible, and visible as the default route ("/").

Design considerations:
- The home page is not an app shell; it should provide two prominent entry cards/buttons: "Operator" and "Administrator".
- The Operator link should point to the operator landing route (e.g., `/operator` which already lazy-loads operator routes).
- The Administrator link should point to the admin landing route (e.g., `/admin` or existing admin route root used by TASK003).
- If authentication is added later (TASK002) the links may redirect to login; the home page should not enforce auth itself.
- Provide an optional small description and accessibility labels for each link.

Trade-offs / UX decisions:
- Keep the home page minimal and mobile-first. Provide clear CTAs and avoid heavy visuals.
- Use existing shared UI components where possible (`app-brand`, `app-button`, or simple anchor tiles).
- Make the route lazy-load the home component to keep bundle sizes small.

## Implementation Plan

Contract:
- Inputs: None (static landing page)
- Outputs: User navigation to `/operator` and `/admin`
- Error modes: Missing route targets — tests should validate link hrefs
- Success: Home renders and both links exist and navigate to expected paths (link hrefs correct)

Steps:
1. Create a standalone `HomeComponent` under `src/app/features/home/home.component.ts` with a simple responsive layout and two CTA cards/buttons linking to `/operator` and `/admin`. - Done
2. Create a unit spec `home.component.spec.ts` that verifies rendering and the presence of both links and proper `aria` labels. - Done
3. Register the route in the app routing config (`src/app/app.routes.ts` or the central routes) to use `HomeComponent` for path `''` and make it the default redirect target if needed. - Done
4. Ensure no auth is required on the home page; it simply links to the other route groups.
5. Update docs / memory bank progress (this task file) after implementation and mark the task Completed when done.

Edge cases:
- Admin/operator route roots change — keep links centralized so they are easy to update.
- Mobile layout: ensure the two tiles stack vertically and are tappable.
- Accessibility: ensure buttons/links have aria-labels and focus styles.

Testing strategy:
- Unit test checks: both links exist and contain expected `href` values; component compiles.
- Optional e2e: simple Playwright test that opens `/`, clicks each tile, and verifies navigation (deferred to later if E2E infra added).

## Progress Tracking

**Overall Status:** In Progress - 25%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Create HomeComponent + template | Done | 2026-03-09 | `src/app/features/home/home.component.ts` created |
| 1.2 | Add route to application routing | Done | 2026-03-09 | `src/app/app.routes.ts` updated |
| 1.3 | Unit test: presence of links and hrefs | Done | 2026-03-09 | `home.component.spec.ts` created |
| 1.4 | Accessibility check and responsive styles | Not Started | 2026-03-09 |  |

## Progress Log

### 2026-03-09

- Implemented HomeComponent with three CTAs: Admin, Operator (Mobile), Operator (Desktop).
- Updated root routes to lazy-load the HomeComponent at `/`.
- Created unit test verifying CTAs render.


---

## Acceptance Criteria

- Visiting `/` renders the HomeComponent.
- The page contains two prominent, accessible CTAs linking to `/operator` and `/admin`.
- Unit tests exist that verify the links and the component compiles.
