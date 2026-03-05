# Progress

## Current Status

**Phase**: Foundation complete — TASK001 done. Next: TASK003 (Admin layout shell) and TASK004 (Operator layout shell).

## What Works

- Angular 21 project skeleton generated and running (`npm start`)
- Root `AppComponent` with `RouterOutlet` (standalone)
- `app.routes.ts` with lazy-loaded admin/operator routes (no auth guards — pages accessible by default)
- `app.config.ts` with `provideRouter`, `provideHttpClient`, global `errorInterceptor`
- `docs/api-docs/all.json` — full OpenAPI spec available for reference
- Business flow documented in `docs/main-flow.md`
- Memory bank fully initialized and updated
- 12 tasks created with detailed implementation plans
- CI/CD: GitHub Actions + GitHub Pages
- **DX Tooling (2026-03-04)**:
  - ESLint (`angular-eslint`) + Prettier integrated — `npm run lint` / `npm run lint:fix`
  - Husky pre-commit hook runs `lint-staged` (ESLint + Prettier on staged files only)
  - `commit-msg` hook runs `commitlint` (conventional commits enforced)
  - `.gitattributes` enforces LF line endings repo-wide
  - `.prettierrc` with `endOfLine: lf` to eliminate CRLF issues
  - Bundle analyzer script: `npm run analyze`
  - `index.html` updated: `lang="ru"`, meta description, preconnect hints for Google Fonts
  - **Tailwind CSS v4** via `@import 'tailwindcss'` in `styles.css`, PostCSS config in `postcss.config.js`
    - Empty `@layer base` block to avoid conflicts with Angular Material preflight

## What's Left to Build

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

| Milestone                                       | Task(s) | Status    | Date              |
|-------------------------------------------------|---------|-----------|-------------------|
| Project scaffold                                | —       | ✅ Done    | Before 2026-02-28 |
| Memory bank & planning                          | —       | ✅ Done    | 2026-02-28        |
| CI/CD: GitHub Actions + GitHub Pages            | —       | ✅ Done    | 2026-02-28        |
| DX tooling: ESLint, Husky, commitlint, Tailwind | —       | ✅ Done    | 2026-03-04        |
| Foundation + Material + Models + Services       | TASK001 | ✅ Done    | 2026-02-28        |
| Server Health Indicator                         | TASK000 | ⬜ Pending | —                 |
| Authentication (mock JWT)                       | TASK002 | ⬜ Pending | —                 |
| Admin layout shell                              | TASK003 | ⬜ Pending | —                 |
| Operator layout shell                           | TASK004 | ⬜ Pending | —                 |
| Admin: Equipment Types CRUD                     | TASK005 | ⬜ Pending | —                 |
| Admin: Equipment Statuses CRUD                  | TASK006 | ⬜ Pending | —                 |
| Admin: Equipment CRUD                           | TASK007 | ⬜ Pending | —                 |
| Admin: Tariffs CRUD                             | TASK008 | ⬜ Pending | —                 |
| Admin: Customers + History + Users              | TASK009 | ⬜ Pending | —                 |
| Operator: Dashboard                             | TASK010 | ⬜ Pending | —                 |
| Operator: Rental creation                       | TASK011 | ⬜ Pending | —                 |
| Operator: Return flow                           | TASK012 | ⬜ Pending | —                 |
| End-to-end rental cycle                         | All     | ⬜ Pending | —                 |

