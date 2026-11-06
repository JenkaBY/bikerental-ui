# Initial User Request — Business Settings

## Original Request (Russian)

> Нужно разработать новую страницу для сохранения бизнес-настроек приложения, таких как валюта,
> время на квоту, время для правила прощения и т.д. Полный список бизнес-настроек будет дан позже,
> но этот список будет дополняться и изменяться. Так что важно сейчас продумать концепт динамических
> настроек. Они будут доступны для администратора, оператор будет только получать их с бэкенда, но не
> отображать. Настройки могут быть применены как на уровне всего приложения, так и на уровне точек
> проката.

**English summary:** Build a new admin page for the application's business settings (currency,
rental quota duration, grace-rule duration, …). The final list of settings is not known yet and will
keep growing and changing, so the settings must be **dynamic** (data-driven), not hardcoded per
setting. Admins view and edit them; the operator app only fetches them from the backend and never
displays them. A setting can apply to the whole network (global) or be overridden per rental point.

## Agreed Design (concept approved by the product owner)

Design canvas (reference only): https://claude.ai/artifact/NSJCTou2sQBtzveS5bAj8j

### Data model (backend-owned)

1. **Setting definition catalog** — one entry per setting, owned and changed by the backend:
   `key` (dotted, e.g. `rental.quota.duration`), `category`, `type`, constraints (`min`, `max`,
   `options`, `unit`, `maxLength`, …), `allowedScopes` (`GLOBAL` only, or `GLOBAL` + `POINT`),
   `default`, display `order`, `deprecated` flag, and localized `label` / `description` (en + ru).
2. **Setting values** — `key`, `scope` (`GLOBAL` | `POINT`), `pointSlug` (only for `POINT`),
   `value` (JSON shaped by `type`), `version` (optimistic concurrency), `updatedBy`, `updatedAt`.
   No `POINT` row for a key = the point inherits.
3. **Effective value** — resolved on the server:
   `point value ?? global value ?? catalog default`.

### Dynamic rendering principle

- The UI knows **types**, not individual keys. A frontend registry maps each `type` to one control:
  `ENUM` → select, `BOOLEAN` → switch, `DURATION` → number + "min", `MONEY` → number + current
  currency (from `finance.currency`), `INTEGER` → number + unit, `DECIMAL`/`PERCENT` → number,
  `TIME` → time picker (point-local time), `STRING` → text field.
- Validation comes from the definition's constraints, not from frontend code.
- Adding a setting of an existing type is a backend-only change (new catalog row) — no UI release.
- Setting labels and descriptions come from the catalog in both locales; the frontend does **not**
  keep per-setting `$localize` strings. Page chrome (title, buttons, statuses, chips) is still
  `$localize`d via `Labels.*` per AGENTS.md.
- An unknown `type` (backend shipped it before the frontend) is shown read-only as text, logged as a
  WARN with the key, and never breaks the page.

### Admin page — `/admin/settings` ("Бизнес-настройки" / "Business settings", new sidebar item)

- Header with title, short description and a search field (searches label, key and description
  across all categories).
- **Scope switcher:** "Whole network" | "Rental point" (+ point select when point is chosen).
- Left: category list (from the catalog) with a count badge — number of settings in global mode,
  number of overrides for the selected point in point mode.
- Right: setting rows — label, description, key (monospace), the typed control, range hint or
  inline validation error, an "Edited" marker for unsaved changes.
- Global mode: each row shows a chip "Whole network only" or "Network + points" and, when overridden
  somewhere, "Overridden in N points".
- Point mode, per row:
  - **Inherited** — read-only control showing the network value + "Override for point" button.
  - **Overridden** — editable control, shows "Network: <value>" + "Reset to network" button.
  - **Network only** — locked, "Not configurable per point".
- Sticky bottom bar: unsaved-changes counter, "Discard", "Save" (disabled when nothing changed or
  any validation error). Edits across the global scope and several points accumulate in one draft.
- Save = one batch request with only the changed keys, each carrying its `version`. `409` conflict →
  reload and tell the admin which settings another admin changed. "Reset to network" deletes the
  `POINT` value.

### Operator app

- On login / shift open, fetch the **effective** settings for the operator's point and keep them in a
  shared, root-provided store. Nothing is displayed. Consumers (currency formatting, quota, grace,
  …) read typed accessors from that store.

### Example settings (placeholders — the real list comes later)

| Key | Type | Scope |
|-----|------|-------|
| `finance.currency` | ENUM (BYN/RUB/USD/EUR) | Global only |
| `finance.rounding.step` | ENUM | Global only |
| `finance.deposit.default` | MONEY | Global + point |
| `rental.quota.duration` | DURATION 1–240 min | Global + point |
| `rental.min.duration` | DURATION | Global + point |
| `rental.overdue.autoclose` | BOOLEAN | Global + point |
| `grace.enabled` | BOOLEAN | Global + point |
| `grace.duration` | DURATION 0–60 min | Global + point |
| `grace.max.per.day` | INTEGER | Global only |
| `cash.shift.autoclose` | TIME | Global + point |

These are illustrative only; no FR may hardcode them. (A `cash.limit` example appears on the design
canvas; REQ-POINT-CASH declared cash limits out of scope, so treat it as illustrative only.)

### Backend dependency

No business-settings endpoints exist yet in the OpenAPI spec (only per-user
`/api/auth/me/settings`, which is unrelated). The backend contract (catalog, values, effective,
batch update with versions) must be agreed; frontend work that depends on it is blocked until
`npm run generate:api` picks it up.
