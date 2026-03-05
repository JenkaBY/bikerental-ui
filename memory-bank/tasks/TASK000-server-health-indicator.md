# TASK000 - Server Health Indicator

**Status:** Pending  
**Added:** 2026-03-04  
**Updated:** 2026-03-04  
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

From `docs/api-docs/all.json` we can see: `info.version = "commit: 70b3114"`.
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

Use `interval()` from RxJS + `takeUntilDestroyed()` or `DestroyRef`. Start it via `APP_INITIALIZER` — it should start immediately when the app loads. Period: 300_000 ms (5 minutes). The first request should run immediately at startup.

## Implementation Plan

- [ ] 1.1 — Create `core/health/health.model.ts` — interfaces `HealthResponse`, `HealthComponentStatus`, `ServerInfo`
- [ ] 1.2 — Create `core/health/health.service.ts` — HTTP GET `/actuator/health` and `/actuator/info`, signals `status`, `info`, `lastChecked`, `error`
- [ ] 1.3 — Create `core/health/health-poller.service.ts` — `interval(300_000)` + immediate first call, register via `APP_INITIALIZER`
- [ ] 1.4 — Hook the `healthPollerInitializer` into `app.config.ts`
- [ ] 1.5 — Create `shared/components/health-indicator/health-indicator.component.ts` — `OnPush`, standalone, `MatTooltip`, color dot using Tailwind classes
- [ ] 1.6 — Embed `<app-health-indicator>` into the admin toolbar shell (TASK003)
- [ ] 1.7 — Embed `<app-health-indicator>` into the operator toolbar shell (TASK004)

## Progress Tracking

**Overall Status:** Not Started — 0%

### Subtasks

| ID  | Description                 | Status      | Updated    | Notes                                                        |
|-----|-----------------------------|-------------|------------|--------------------------------------------------------------|
| 1.1 | health.model.ts             | Not Started | 2026-03-04 |                                                              |
| 1.2 | health.service.ts           | Not Started | 2026-03-04 |                                                              |
| 1.3 | health-poller.service.ts    | Not Started | 2026-03-04 | APP_INITIALIZER                                              |
| 1.4 | Hook into app.config.ts     | Not Started | 2026-03-04 |                                                              |
| 1.5 | health-indicator.component  | Not Started | 2026-03-04 | Tailwind + MatTooltip, dot + timestamp `HH:mm:ss` next to it |
| 1.6 | Embed into admin toolbar    | Not Started | 2026-03-04 | Depends on TASK003                                           |
| 1.7 | Embed into operator toolbar | Not Started | 2026-03-04 | Depends on TASK004                                           |

## Progress Log

### 2026-03-04

- Task created
- Decision made: place the indicator in the right corner of the toolbar in both layouts
- Architecture defined: `core/health/` for services, `shared/components/health-indicator/` for UI
- Version is taken from `/actuator/info`, fallback — OpenAPI `/v3/api-docs`
- Background worker via `APP_INITIALIZER` + RxJS `interval`

