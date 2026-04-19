# Bike Rental UI — Agent Guide

Angular 21 POS for a bike rental shop. Two lazy-loaded feature modules:
- **Admin** (`/admin/**`) — desktop-first (≥22" 1080p), CRUD management via `MatDialog` forms
- **Operator** (`/operator/**`) — mobile-first, multi-step stepper rental flow + QR scanner return

> **Memory Bank first.** Before any task, read all files in `memory-bank/` — especially `activeContext.md`, `tasks/_index.md`, and `progress.md`. They are the sole source of truth across sessions.

## Commands

```powershell
npm start          # dev server → http://localhost:4200
npm test           # Vitest (watch=false)
npm run test:watch # Vitest in watch mode
npm run test:coverage  # coverage report
npm run fix        # ESLint --fix + Prettier (run before committing)
npm run i18n:extract   # extract $localize strings to src/locale/messages.xlf
```

## Three-Layer Data Pipeline (enforced)

```
Backend JSON  →  core/models/   →  core/mappers/  →  core/domain/  →  Components
 *Response         (API types)     fromResponse()     Tariff, …       import only from here
 *Request                          toRequest()
```

- `core/models/` — raw API shapes only; consumed exclusively by `core/api/` services and `core/mappers/`
- `core/mappers/` — pure static classes: `XyzMapper.fromResponse(r)` / `XyzMapper.toRequest(w)`
- `core/domain/` — clean UI objects with `Date` fields; the **only** types components/dialogs import
- Services in `core/api/` apply the mapper internally; their public signatures always use domain types

## Angular Patterns

- **Standalone components only** — no NgModules; declare `imports: []` per component
- **`ChangeDetectionStrategy.OnPush`** on every component
- **`inject()`** for DI (never constructor injection)
- **`input()` / `output()`** signal functions (not `@Input` / `@Output` decorators)
- **`signal()` / `computed()`** for all local state; `takeUntilDestroyed()` for Observable subscriptions
- **Size limit**: max ~200 lines TS + ~100 lines HTML per component; split if larger

## i18n Rules

All visible text must use Angular's `$localize` — never raw string literals in templates or TS.

- **UI labels** → add to `shared/constant/labels.ts` as `Labels.Xyz = $localize\`...\``
- **Form validation messages** → add to `shared/validators/form-error-messages.ts` as `FormErrorMessages.xyzRequired`
- Extract after adding strings: `npm run i18n:extract`

## Admin CRUD Pattern

Each domain = `*-list.component.ts` (smart, `MatTable` + signals) + `*-dialog.component.ts` (create/edit via `MAT_DIALOG_DATA`).

```typescript
// In list component — open dialog, refresh on true result
openEditDialog(row: EquipmentTypeResponse) {
  this.dialog.open(EquipmentTypeDialogComponent, { data: { type: row } })
    .afterClosed()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(result => { if (result) this.load(); });
}
```

Dialog closes with `true` on success (triggers list refresh), or `undefined`/`false` on cancel.

## Testing (Vitest)

- Test files: `*.spec.ts` alongside source. Use `vi.fn()` (not `jasmine.spyOn`).
- Don't test services that just wrap `HttpClient` calls; do test all components and custom service logic.
- Provide stubs via `TestBed.configureTestingModule` `providers` — never `spyOn` Angular internals.
- Dialog tests inject `MAT_DIALOG_DATA` and `MatDialogRef` as value providers.
- Split error-path tests into a separate `*.error.spec.ts` file when error handling is non-trivial.

```typescript
await TestBed.configureTestingModule({
  imports: [EquipmentTypeDialogComponent],
  providers: [
    { provide: EquipmentTypeService, useValue: makeService() },
    { provide: MatDialogRef, useValue: { close: vi.fn() } },
    { provide: MAT_DIALOG_DATA, useValue: {} },
    { provide: MatSnackBar, useValue: { open: vi.fn() } },
  ],
}).compileComponents();
```

## Key Files

| Path | Purpose |
|------|---------|
| `memory-bank/systemPatterns.md` | Full architecture, component tree, API integration patterns |
| `memory-bank/tasks/_index.md` | All task IDs, statuses, and dependency chain |
| `src/app/core/models/` | Raw API `*Request`/`*Response` types |
| `src/app/core/domain/` | UI domain objects (what components use) |
| `src/app/shared/constant/labels.ts` | i18n label constants |
| `src/app/shared/validators/form-error-messages.ts` | i18n form error constants |
| `src/app/app.config.ts` | Application providers (HTTP client, interceptors, locale) |

## Constraints

- No SSR, no NgModules, no NgRx, no `any` type
- Auth (`TASK002`) is intentionally unimplemented last — all routes are currently open
- Avoid all Angular APIs marked deprecated in v21 (e.g. use `provideAnimationsAsync()` approach, not `provideAnimations()`)
- No code comments — the code should be self-documenting

