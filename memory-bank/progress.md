# Progress

## Current Status

**Phase**: Planning Complete — 12 tasks defined, ready to begin implementation with TASK001.

## What Works

- Angular 21 project skeleton generated and running (`npm start`)
- Root `AppComponent` with `RouterOutlet` (standalone)
- `app.routes.ts` present (empty routes array)
- `app.config.ts` present with `provideRouter(routes)` and `provideBrowserGlobalErrorListeners()`
- `docs/api-docs/all.json` — full OpenAPI spec available for reference
- Business flow documented in `docs/main-flow.md`
- Memory bank fully initialized and updated (2026-02-28)
- 12 tasks created with detailed implementation plans

## What's Left to Build

### Foundation (TASK001)
- [ ] Install Angular Material + CDK + html5-qrcode + @angular/localize
- [ ] Environment files with API base URL
- [ ] All TypeScript interfaces from OpenAPI spec
- [ ] All API services (7 services: Customer, Equipment, EquipmentType, EquipmentStatus, Tariff, Rental, Payment)
- [ ] Global error interceptor for ProblemDetail
- [ ] Root routing skeleton with lazy-loaded admin/operator groups

### Authentication (TASK002)
- [ ] AuthService with mock JWT login
- [ ] Auth interceptor (Bearer token header)
- [ ] Auth guard + role guard
- [ ] Login page component

### Admin Module (TASK003, TASK005–TASK009)
- [ ] Admin layout shell (sidenav + toolbar)
- [ ] Equipment Types CRUD
- [ ] Equipment Statuses CRUD
- [ ] Equipment CRUD (paginated, filtered)
- [ ] Tariffs CRUD (with activate/deactivate)
- [ ] Customers (search + edit)
- [ ] Rental history (read-only)
- [ ] Payment history (read-only)
- [ ] User management placeholder

### Operator Module (TASK004, TASK010–TASK012)
- [ ] Operator layout shell (bottom nav + toolbar)
- [ ] Active rentals dashboard
- [ ] Rental creation flow (4-step stepper)
- [ ] QR scanner shared component
- [ ] Equipment return flow (QR scan + cost breakdown)

## Known Issues

- Login endpoint (`POST /api/auth/login`) not yet available on backend — using mock
- User management API not yet available — placeholder page only

## Milestones

| Milestone | Task(s) | Status | Date |
|---|---|---|---|
| Project scaffold | — | ✅ Done | Before 2026-02-28 |
| Memory bank & planning | — | ✅ Done | 2026-02-28 |
| Foundation + Material + Models + Services | TASK001 | ⬜ Pending | — |
| Authentication (mock JWT) | TASK002 | ⬜ Pending | — |
| Admin layout shell | TASK003 | ⬜ Pending | — |
| Operator layout shell | TASK004 | ⬜ Pending | — |
| Admin: Equipment Types CRUD | TASK005 | ⬜ Pending | — |
| Admin: Equipment Statuses CRUD | TASK006 | ⬜ Pending | — |
| Admin: Equipment CRUD | TASK007 | ⬜ Pending | — |
| Admin: Tariffs CRUD | TASK008 | ⬜ Pending | — |
| Admin: Customers + History + Users | TASK009 | ⬜ Pending | — |
| Operator: Dashboard | TASK010 | ⬜ Pending | — |
| Operator: Rental creation | TASK011 | ⬜ Pending | — |
| Operator: Return flow | TASK012 | ⬜ Pending | — |
| End-to-end rental cycle | All | ⬜ Pending | — |

