# TASK000 - Server Health Indicator

**Status:** Completed
**Added:** 2026-03-04
**Updated:** 2026-03-06
**Depends on:** TASK001
**Blocks:** None

## Original Request

Create a component that displays the server status via Spring Boot Actuator (`/actuator/health`), the API version (commit hash from the `info.version` field in OpenAPI or `/actuator/info`), and other details. Add a background worker that polls the health endpoint every 5 minutes. Display it as a colored dot with a tooltip on every page.

## Thought Process

### Where to place the indicator (UI/UX decision)

The application has two modules with different layouts:

- **Admin** — desktop, sidenav + toolbar (horizontal toolbar at the top)
- **Operator** — mobile, bottom nav + toolbar at the top

The best place is the **right corner of the toolbar** in both layouts. This is standard practice:

- Always visible, doesn't interfere with content
- The toolbar is present on every page of both modules
- On mobile (operator) the right corner of the toolbar is a familiar place for status icons
- A small circle (12–16px) doesn't clutter the UI

The component will be embedded in both toolbar shell components (TASK003, TASK004) via `shared/`.

### Architecture

```
core/
  health/
    health.model.ts         — interfaces HealthResponse, HealthStatus
    health.service.ts       — HTTP calls to /actuator/health + /actuator/info, state signals
    health-poller.service.ts — background interval worker (5 min), started in APP_INITIALIZER

shared/
  components/
    health-indicator/
      health-indicator.component.ts   — dot + MatTooltip
      health-indicator.component.html
```

### `/actuator/health` endpoint

Spring Boot Actuator returns:

```json
{
  "status": "UP",
  "components": {
    "db": {
      "status": "UP"
    },
    "diskSpace": {
      "status": "UP"
    }
  }
}
```

Statuses: `UP` → green, `DOWN` → red, `OUT_OF_SERVICE` → yellow, unavailable → gray.

### API Version

The version is taken from `/actuator/info` (Spring Boot convention):

```json
{
  "build": {
    "version": "commit: 70b3114"
  }
}
```

If `/actuator/info` is not available — parse from OpenAPI `/v3/api-docs` as a fallback.

### Tooltip

Contains:

- Status: UP / DOWN / UNKNOWN
- Version: commit hash
- Time of last check
- Components (db, diskSpace) if status is not UP

### Display next to the dot

Next to the dot display a compact timestamp of the last check in `HH:mm:ss` format. Example: `● 14:32:05` This gives the operator an immediate sense of data freshness without hovering over the tooltip.

### Background Worker

Use `interval()` from RxJS + `takeUntilDestroyed()`. Start it via `APP_INITIALIZER` — it should start immediately when the app loads. Period is configurable via `environment.healthPollIntervalMs` (default: 300_000 ms). The first request runs immediately at startup.

### `/actuator/info` — One-Time Fetch

`/actuator/info` is fetched **exactly once** — only after the first `UP` status is received from `/actuator/health`, and only if `serverInfo` signal is still `null`. Subsequent `UP` polls skip the info call entirely. This avoids redundant requests since the build version never changes at runtime.

## Implementation Plan

- [x] 1.0 — Add `healthPollIntervalMs` to `environment.ts` and `environment.prod.ts`
- [x] 1.1 — Create `core/health/health.model.ts` — interfaces `HealthResponse`, `HealthComponentStatus`, `ServerInfo`, union type `HealthStatus`
- [x] 1.2 — Create `core/health/health.service.ts` — HTTP GET `/actuator/health`; one-time GET `/actuator/info` on first `UP`; signals `status`, `components`, `serverInfo`, `lastChecked`, `error`
- [x] 1.3 — Create `core/health/health-poller.service.ts` — `interval(environment.healthPollIntervalMs)` + immediate first call + `takeUntilDestroyed()`
- [x] 1.4 — Hook the `HealthPollerService` into `app.config.ts` via `provideAppInitializer`
- [x] 1.5 — Create `shared/components/health-indicator/` — refactored into 4 files + 1 builder (see below)
- [x] 1.6 — Write unit tests: 54 tests across 6 spec files; branch coverage 87%
- [x] 1.6a — Refactor tooltip into `HealthTooltipComponent` + `HealthTooltipLineComponent`
- [x] 1.6b — Extract `buildTooltipLines()` pure function into `health-tooltip-lines.builder.ts`
- [x] 1.6c — Add `<app-health-indicator>` to `AppComponent` (fixed bottom-right) for i18n extraction
- [x] 1.6d — Generate `src/locale/messages.xlf` (8 messages, English source)
- [→] 1.7 — Moved to **TASK013**: embed `<app-health-indicator>` into admin toolbar shell
- [→] 1.8 — Moved to **TASK013**: embed `<app-health-indicator>` into operator toolbar shell

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

| ID   | Description                          | Status    | Updated    | Notes                                                                                |
|------|--------------------------------------|-----------|------------|--------------------------------------------------------------------------------------|
| 1.0  | environment.healthPollIntervalMs     | Complete  | 2026-03-06 | Added to both environment files                                                      |
| 1.1  | health.model.ts                      | Complete  | 2026-03-06 | HealthStatus union, HealthResponse, HealthComponentStatus, ServerInfo                |
| 1.2  | health.service.ts                    | Complete  | 2026-03-06 | /actuator/info fetched once on first UP; guarded by serverInfo signal                |
| 1.3  | health-poller.service.ts             | Complete  | 2026-03-06 | interval(env.healthPollIntervalMs) + immediate call + takeUntilDestroyed             |
| 1.4  | Hook into app.config.ts              | Complete  | 2026-03-06 | provideAppInitializer (APP_INITIALIZER deprecated)                                   |
| 1.5  | health-indicator component suite     | Complete  | 2026-03-06 | 4 files: indicator + tooltip + tooltip-line + builder                                |
| 1.6  | Unit tests                           | Complete  | 2026-03-06 | 54/54 pass; 6 spec files; branch coverage 87%                                        |
| 1.6a | Tooltip component decomposition      | Complete  | 2026-03-06 | HealthTooltipComponent + HealthTooltipLineComponent; CDK overlay replaces matTooltip |
| 1.6b | buildTooltipLines() pure function    | Complete  | 2026-03-06 | 3 domain params: health, serverInfo, lastChecked; locale optional 4th                |
| 1.6c | AppComponent embeds health indicator | Complete  | 2026-03-06 | Fixed bottom-right; enables i18n extraction from compiler tree                       |
| 1.6d | i18n extraction                      | Complete  | 2026-03-06 | src/locale/messages.xlf with 8 messages; English source strings                      |
| 1.7  | Embed into admin toolbar             | → TASK013 | 2026-03-06 | Moved to TASK013; completed there                                                    |
| 1.8  | Embed into operator toolbar          | → TASK013 | 2026-03-06 | Moved to TASK013; completed there                                                    |

## Progress Log

### 2026-03-06 — Refactor

- Decomposed tooltip string into 3 components:
  - `HealthTooltipComponent` — dumb, receives `lines: TooltipLine[]` via `input.required()`; single `@for` loop with `separator` flag
  - `HealthTooltipLineComponent` — dumb single-line; hides itself when `value` is `null`/`undefined`
- Extracted `buildTooltipLines(health, serverInfo, lastChecked, locale?)` as a pure function in `health-tooltip-lines.builder.ts`
  - `TOOLTIP_LINE_LABELS` and `TooltipLineId` moved into builder (their only consumer)
  - First param: `Pick<HealthResponse, 'status' | 'components'> & { error? }` — carries status, components, error
  - Second param: `ServerInfo | null` — server info from `/actuator/info`
  - Third param: `Date | null` — raw lastChecked; formatted internally
- Replaced `matTooltip` (string-only) with CDK `cdkConnectedOverlay` so a real component renders as tooltip
- Replaced deprecated `APP_INITIALIZER` with `provideAppInitializer`; removed deprecated `provideNoopAnimations` / `provideAnimationsAsync` from tests
- Switched i18n source language from Russian to English (`$localize` default strings); Russian will be in `messages.ru.xlf`
- Added `<app-health-indicator>` to `AppComponent` (fixed `bottom-2 right-2`) so Angular compiler visits the files and `ng extract-i18n` picks up all 8 `$localize` calls → generated `src/locale/messages.xlf`
- Test suite grew from 17 (2 spec files) → 54 (6 spec files); branch coverage 76% → 87%
  - `health-tooltip-lines.builder.spec.ts`: 19 pure unit tests, no TestBed, ~16 ms
  - `health-tooltip.component.spec.ts`: 6 tests; uses `lines` input directly, no service
  - `health-tooltip-line.component.spec.ts`: 6 tests; `it.each` for null/undefined/empty-string branches
  - `health-indicator.component.spec.ts`: 11 tests; `it.each` for dot colours
  - `health.service.spec.ts`: 11 tests

### 2026-03-06 — Initial Implementation

- Revised requirements applied: `/actuator/info` is fetched only once after first `UP` status; polling interval made configurable via `environment.healthPollIntervalMs`
- Added `healthPollIntervalMs: 300_000` to both `environment.ts` and `environment.prod.ts`
- Created `core/health/health.model.ts` — `HealthStatus` union type, `HealthResponse`, `HealthComponentStatus`, `ServerInfo`
- Created `core/health/health.service.ts` — signals `status`, `components`, `serverInfo`, `lastChecked`, `error`; `fetchInfo()` is private and guarded so it runs exactly once
- Created `core/health/health-poller.service.ts` — immediate first call + `interval(env.healthPollIntervalMs)` + `takeUntilDestroyed()`
- Hooked `HealthPollerService` into `app.config.ts` via `APP_INITIALIZER`
- Created `shared/components/health-indicator/health-indicator.component.ts` — standalone, `OnPush`, Tailwind colored dot, `HH:mm:ss` timestamp, multi-line `matTooltip` via `computed()` signal
- Wrote 8 unit tests for `HealthService` and 8 for `HealthIndicatorComponent` — 17/17 pass, lint clean
- Subtasks 1.7 and 1.8 remain deferred pending TASK003 and TASK004

### 2026-03-04

- Task created
- Decision made: place the indicator in the right corner of the toolbar in both layouts
- Architecture defined: `core/health/` for services, `shared/components/health-indicator/` for UI
- Version is taken from `/actuator/info`, fallback — OpenAPI `/v3/api-docs`
- Background worker via `APP_INITIALIZER` + RxJS `interval`

