# TASK013 - Embed Health Indicator into Toolbar Shells

**Status:** Not Started
**Added:** 2026-03-06
**Updated:** 2026-03-06
**Depends on:** TASK003, TASK004
**Blocks:** None

## Original Request

Moved from TASK000 subtasks 1.7 and 1.8:

- Embed `<app-health-indicator>` into the admin toolbar shell (was TASK000 subtask 1.7)
- Embed `<app-health-indicator>` into the operator toolbar shell (was TASK000 subtask 1.8)

## Thought Process

TASK003 and TASK004 (full layout shells) are not yet built. However the placeholder components that
currently serve as the admin and operator route shells are the correct place to embed the indicator
right now. Adding a minimal toolbar (`<header>`) to each placeholder:

- Unblocks i18n extraction for toolbar title strings
- Makes `<app-health-indicator>` visible on every admin and operator page immediately
- Removes the temporary fixed `bottom-2 right-2` placement from `AppComponent`

When TASK003 and TASK004 implement the real `mat-sidenav` / bottom-nav shells, they will simply
move `<app-health-indicator>` from the placeholder's `<header>` to the real `mat-toolbar`.
This task will remain Completed — the indicator is embedded; the surrounding shell just gets upgraded.

## Implementation Plan

- [] 1.1 — Add minimal `<header>` toolbar with `<app-health-indicator>` to `AdminPlaceholderComponent`
- [] 1.2 — Add minimal `<header>` toolbar with `<app-health-indicator>` to `OperatorPlaceholderComponent`
- [] 1.3 — Remove temporary fixed placement (`bottom-2 right-2`) from `AppComponent`
- [] 1.4 — Confirm `ng extract-i18n` picks up new toolbar title strings (Messages: 10)

## Progress Tracking

**Overall Status:** Completed — 0%

### Subtasks

| ID  | Description                                      | Status   | Updated    | Notes                                                        |
|-----|--------------------------------------------------|----------|------------|--------------------------------------------------------------|
| 1.1 | Health indicator in admin placeholder toolbar    | Complete | 2026-03-06 | Added `<header>` with title + `<app-health-indicator />`     |
| 1.2 | Health indicator in operator placeholder toolbar | Complete | 2026-03-06 | Same pattern; `i18n="@@operator.toolbar.title"` on title     |
| 1.3 | Remove fixed placement from AppComponent         | Complete | 2026-03-06 | `app.html` back to `<router-outlet />` only                  |
| 1.4 | i18n extraction                                  | Complete | 2026-03-06 | Messages grew from 8 → 10; admin + operator titles extracted |

## Progress Log

### 2026-03-06

- Created task by splitting TASK000 subtasks 1.7 and 1.8
- Added minimal `<header class="flex items-center justify-between ...">` with title span and `<app-health-indicator />`
  to both `AdminPlaceholderComponent` and `OperatorPlaceholderComponent`
- Both components import `RouterOutlet` + `HealthIndicatorComponent`; titles use `i18n="@@admin.toolbar.title"` /
  `i18n="@@operator.toolbar.title"` for future translation
- Removed `<div class="fixed bottom-2 right-2 z-50">` block from `app.html` (was temporary workaround)
- `app.ts` no longer imports `HealthIndicatorComponent`
- All 54 tests still pass; `ng extract-i18n` reports 10 messages
- When TASK003/TASK004 build real toolbar shells, they move `<app-health-indicator>` from placeholder header to
  `mat-toolbar` — this task stays Completed

