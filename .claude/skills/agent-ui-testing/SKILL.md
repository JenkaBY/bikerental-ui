---
name: agent-ui-testing
description: How the agent verifies a UI change end-to-end in the browser pane without a human login — pick the app, start it, choose a seeded user/role/tenant, log in via the dev-only session URL or get raw tokens, set token lifetimes for auth scenarios, exercise the change, check console/network, and collect proof. Use when asked to "verify / test / check the change in the browser", "check as admin / operator / platform manager", reproduce an auth or token-expiry bug, or switch between users.
---

# Agent UI testing

## 1. When to verify, which app

Verify only when the change is observable in a running app (template, styles, routing, store
behaviour visible on screen, API calls). Pure types/tooling/tests → skip.

| App      | Port | `launch.json` entry                | Client id              | Roles              |
| -------- | ---- | ---------------------------------- | ---------------------- | ------------------ |
| gateway  | 4200 | `gateway-dev`                      | — (no auth)            | —                  |
| admin    | 4201 | `admin-dev` / `admin-dev-ru`       | `bike-rental-admin`    | `ADMIN`            |
| operator | 4202 | `operator-dev` / `operator-dev-ru` | `bike-rental-operator` | `OPERATOR`         |
| platform | 4203 | `platform-dev`                     | `bike-rental-platform` | `PLATFORM_MANAGER` |

A change in `projects/shared` can affect every app — verify the apps that render it.

## 2. Preconditions

1. Backend on `http://localhost:8080` (`environment.ts` → `apiUrl`) with the `dev` profile:
   `curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/dev/auth/users` → `200`.
   `404` → not in the dev profile; tell the user, auto-login is impossible.
2. Start the SPA with `preview_start {name: "<entry>"}` — never via Bash. Only the `ng serve`
   `development` configuration has `devAuth: true`.

## 3. Choose users

`npm run dev-auth -- --users` (or `GET /api/dev/auth/users`) lists seeded platform managers, clients,
admins and operators with username, roles and tenant. Pick the user(s) the scenario needs; a
cross-tenant or two-role scenario needs two users.

## 4. Get a session / token

### Browser pane (session)

Navigate the app tab to its base URL with `devLogin`:

```
http://localhost:4201/?devLogin=ADMIN&user=dev.admin.acme
```

| Param      | Maps to                   | Example                   |
| ---------- | ------------------------- | ------------------------- |
| `devLogin` | `roles` (comma-separated) | `ADMIN`, `OPERATOR,ADMIN` |
| `user`     | `username`                | `dev.operator.acme`       |
| `tenant`   | `tenantId`                | client id                 |
| `at`       | `accessTokenTtl`          | `PT30S`                   |
| `rt`       | `refreshTokenTtl`         | `PT10M`                   |
| `refresh`  | `includeRefreshToken`     | `false`                   |

The app (`dev-login.ts`) probes `/api/dev/auth/users`, clears `oidc-<clientId>` sessionStorage,
redirects to `/api/dev/auth/session?...&redirect=<DeployedPath base>`, the backend sets the session,
and the normal `checkAuth()` → `/oauth2/authorize` completes silently. Never hand-build the session
URL for the app — use the `devLogin` param.

**Switch user**: navigate to another `devLogin` URL — it replaces the session; no logout needed.

### Raw tokens (API checks)

```
npm run dev-auth -- --app operator --roles OPERATOR --user dev.operator.acme --field access_token
```

Flags: `--app admin|operator|platform`, `--roles`, `--user`, `--tenant`, `--at`, `--rt`,
`--no-refresh`, `--field <name>`, `--api <url>`. Without `--field` prints JSON with
`access_token`, `refresh_token`, `id_token`, `expires_in`, `refresh_expires_in`. Use as
`Authorization: Bearer <token>` in `curl`. Never paste tokens into the chat reply.

### Scenario → TTLs

| Scenario                                 | URL params                                      | Expect                                      |
| ---------------------------------------- | ----------------------------------------------- | ------------------------------------------- |
| Happy path                               | none                                            | home, roles/tenant applied                  |
| Access near expiry                       | `at=PT45S&rt=PT10M`                             | next request refreshes first (stale < 60 s) |
| Access expired on reload                 | `at=PT1S&rt=PT10M`, wait 2 s, reload            | `recoverSession()` via refresh token        |
| Both expired                             | `at=PT1S&rt=PT1S`, wait 2 s, deep link + reload | login redirect, return URL restored         |
| No refresh token                         | `at=PT1S&refresh=false`, wait                   | 401 → login                                 |
| Must change password                     | seeded user with `must_change_password`         | `/change-password` gate                     |
| Wrong role                               | e.g. `devLogin=OPERATOR` on admin               | `/forbidden`                                |
| Other tenant / suspended / closed client | `tenant=<id>` or matching user                  | tenant honoured, lifecycle gates            |
| Switch user                              | second `devLogin` URL                           | new session, stores cleared                 |

Force expiry: short `at`, then `computer {action:"wait"}` past it (≤ 10 s per call).

## 5. Exercise the change

- Navigate to the affected route; prefer `read_page` / `find` / `get_page_text` over screenshots.
- Use `form_input` / `computer` clicks for interactions, re-read the page to confirm.
- Text changed → also check the Russian build (`admin-dev-ru`, `operator-dev-ru`; same port, stop the
  English server first).

## 6. Checks

- `read_console_messages {onlyErrors:true}` — no errors; one `[dev-auth]` warning only if the dev
  profile is off.
- `read_network_requests` — no unexpected 4xx/5xx; one toast per failure (no double notification).
- Auth redirects land where the scenario table says.

## 7. Proof and cleanup

Report a screenshot of the final state and/or relevant network lines (no tokens). Stop servers you
started with `preview_stop` when done.

## 8. Troubleshooting

| Symptom                                                 | Cause / fix                                                                                                   |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `[dev-auth] ... unavailable` warning, normal login page | backend not in `dev` profile (`/api/dev/auth/**` 404)                                                         |
| Backend error `redirect_uri` / redirect not allowed     | app base URL not registered for the client in backend dev seeds                                               |
| Still logged in as previous user                        | stale `oidc-<clientId>` in sessionStorage — clear via `javascript_tool` (`sessionStorage.clear()`) and reload |
| CORS error on `/api/dev/auth/users`                     | backend CORS must allow `http://localhost:420x` in the dev profile                                            |
| `devLogin` ignored                                      | running a non-`development` build (`devAuth: false`)                                                          |
