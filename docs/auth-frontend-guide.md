# Frontend Authentication & Authorization Guide

This guide explains how a **frontend application (SPA)** — or an **AI coding agent building that frontend** —
authenticates users and authorizes API calls against the BikeRental backend.

The backend serves **two** SPAs against the same identity provider: an **admin console** and an **operator app**.
Each is registered as its own OAuth2 client (see §2). They share this entire flow — only the `client_id` and origin
differ. Which features a user sees is driven by the token's `roles` claim, **not** by which app they signed in to.

The backend is a standards-based **OAuth 2.1 / OpenID Connect** provider (Spring Authorization Server). The SPA is a
**public client** using the **Authorization Code flow with PKCE**. There is no password grant; the SPA never handles
raw credentials — the user authenticates on the backend's hosted login page (username/password or "Sign in with
Google"), and the SPA only exchanges an authorization code for tokens.

---

## 1. Endpoints

Everything is derived from the **issuer** (default `http://localhost:8080`; configured by `app.security.jwt.issuer`).
Always read the discovery document instead of hard-coding paths:

```
GET {issuer}/.well-known/openid-configuration
```

| Purpose | Endpoint | Notes |
|---------|----------|-------|
| Discovery | `/.well-known/openid-configuration` | issuer, endpoints, jwks_uri |
| Authorization | `/oauth2/authorize` | start login (redirect) |
| Token | `/oauth2/token` | exchange code / refresh |
| JWKS | `/oauth2/jwks` | public keys to verify JWT signatures |
| UserInfo | `/userinfo` | OIDC claims for the access token |
| Token revocation | `/oauth2/revoke` | revoke a refresh/access token |
| RP-initiated logout | `/connect/logout` | end the SSO session |

The **business API** lives under `/api/**` and is protected as a JWT **resource server**.

## 2. Registered SPA clients

Each app is pre-registered (seeded) on the backend — you do **not** register it from the frontend. Use the
`client_id` and origin that match the app you are building:

| App | `client_id` | `redirect_uri` | `post_logout_redirect_uri` |
|-----|-------------|----------------|----------------------------|
| Admin console | `bike-rental-admin` | `http://localhost:4201/login/callback` | `http://localhost:4201` |
| Operator app | `bike-rental-operator` | `http://localhost:4202/login/callback` | `http://localhost:4202` |

Both are **public clients** (no client secret) with **PKCE `S256` required**, grant types `authorization_code` +
`refresh_token`, and scopes `openid profile`.

These are configurable via `app.security.spa-clients[*].*`, and both origins are allowed in CORS
(`app.cors.allowed-origins`). If your dev origin differs, ask a backend admin to update the matching client and CORS.

> Both apps authenticate against the same provider. **Authorization is by the `roles` claim** (ADMIN vs OPERATOR),
> not by which client was used — a user holding both roles can use either app. Each app should still gate its UI on
> the expected role (the admin console on `ADMIN`, the operator app on `OPERATOR`).

## 3. Login flow (Authorization Code + PKCE)

**Do not implement PKCE/redirect plumbing by hand.** Use a certified OIDC client library:

- Angular: [`angular-auth-oidc-client`](https://www.npmjs.com/package/angular-auth-oidc-client)
- React/Vue/vanilla: [`oidc-client-ts`](https://github.com/authts/oidc-client-ts)

Conceptually the library does:

1. Generate a `code_verifier` + `code_challenge` (S256) and a `state`/`nonce`.
2. Redirect the browser to
   `{issuer}/oauth2/authorize?response_type=code&client_id=bike-rental-spa&redirect_uri=...&scope=openid%20profile&code_challenge=...&code_challenge_method=S256&state=...`.
3. The backend shows its **login page** (username/password **and** a "Sign in with Google" button). Google sign-in is
   handled entirely on the backend — the SPA does nothing special for it; the user just picks it on the login page.
4. After login the browser is redirected back to `redirect_uri?code=...&state=...`.
5. The library POSTs to `{issuer}/oauth2/token` (`grant_type=authorization_code`, `code`, `redirect_uri`, `client_id`,
   `code_verifier`) and receives `access_token`, `refresh_token`, `id_token`, `expires_in`.

### Example (`oidc-client-ts`)

Use the `client_id` + origin for the app you are building (below: the **admin console**; the **operator app** uses
`client_id: "bike-rental-operator"` with origin `http://localhost:4202`):

```ts
import { UserManager, WebStorageStateStore } from "oidc-client-ts";

export const userManager = new UserManager({
  authority: "http://localhost:8080",          // issuer — discovery is fetched automatically
  client_id: "bike-rental-admin",                 // operator app: "bike-rental-operator"
  redirect_uri: "http://localhost:4201/login/callback",
  post_logout_redirect_uri: "http://localhost:4201",
  response_type: "code",                          // Authorization Code + PKCE (automatic)
  scope: "openid profile",
  automaticSilentRenew: true,                     // uses the refresh token
  userStore: new WebStorageStateStore({ store: window.localStorage }),
});

// kick off login
export const login = () => userManager.signinRedirect();

// on /login/callback
export const completeLogin = () => userManager.signinRedirectCallback();

// access token for API calls
export const getAccessToken = async () => (await userManager.getUser())?.access_token;
```

## 4. Calling the API

Attach the access token as a **Bearer** header to every `/api/**` request:

```ts
const token = await getAccessToken();
const res = await fetch("/api/auth/me", {
  headers: { Authorization: `Bearer ${token}` },
});
```

Use an HTTP interceptor so this happens automatically for all `/api` calls.

## 5. The access token claims

The JWT access token carries (besides standard `iss`, `sub`, `exp`):

| Claim | Meaning | Frontend use |
|-------|---------|--------------|
| `uid` | user UUID | identify the current user |
| `roles` | array, e.g. `["ADMIN","OPERATOR"]` | **role-based UI gating** |
| `must_change_password` | boolean | force the change-password screen |

Decode the JWT (e.g. `jwt-decode`) to read claims for **UI gating only** — never trust it for security decisions
(the backend re-checks every request). Example:

```ts
const { roles, must_change_password } = jwtDecode<{ roles: string[]; must_change_password: boolean }>(token);
const isAdmin = roles.includes("ADMIN");
```

Show admin-only screens (user management) when `roles` includes `ADMIN`; operators get the business screens.

## 6. Forced password change

If `must_change_password` is `true` after login, **block the rest of the app** and route the user to a change-password
screen that calls:

```
POST /api/auth/password
{ "currentPassword": "<temp password>", "newPassword": "<new password>" }
```

Password policy (mirror it in the UI for fast feedback; the backend enforces it regardless): **8–20 characters, at
least one letter and one digit**. On `204 No Content`, refresh the token (the new token has
`must_change_password: false`).

## 7. Self-service & admin endpoints

| Endpoint | Method | Who | Body |
|----------|--------|-----|------|
| `/api/auth/me` | GET | any authenticated | — |
| `/api/auth/password` | POST | any authenticated | `{currentPassword, newPassword}` |
| `/api/auth/users` | POST | ADMIN | `{username, email, displayName, roles[], password?}` → returns `{user, temporaryPassword}` |
| `/api/auth/users` | GET | ADMIN | — |
| `/api/auth/users/{id}` | GET / PUT | ADMIN | PUT: `{displayName?, roles?, status?}` |
| `/api/auth/users/{id}/reset-password` | POST | ADMIN | → returns `{user, temporaryPassword}` |
| `/api/auth/users/{id}/deactivate` | POST | ADMIN | disables the account (**accounts are never deleted**) |

When an admin creates a user or resets a password, the response contains a **one-time `temporaryPassword`** — display
it once so the admin can hand it to the user; the user must change it on first login.

## 8. Refresh & logout

- **Refresh:** the OIDC library auto-refreshes using the `refresh_token` (`automaticSilentRenew`). On `401` from the
  API, attempt a refresh once, then redirect to login if it fails.
- **Logout:** clear local tokens and call `userManager.signoutRedirect()` (RP-initiated logout at
  `/connect/logout`). Note that an admin password-reset or deactivation **revokes the user's refresh tokens** server
  side, so the next refresh fails and the user is sent back to login.

## 9. Error handling

All API errors are RFC 9457 **ProblemDetail** JSON with a stable `errorCode` — branch on `errorCode`, not on `detail`:

| HTTP | `errorCode` | Frontend action |
|------|-------------|-----------------|
| 401 | `identity.authentication.required` | token missing/expired → refresh or redirect to login |
| 403 | `identity.access.denied` | hide/disable the action; show "not allowed" |
| 409 | `identity.username.duplicate` / `identity.email.duplicate` | field-level error on the create form |
| 422 | `identity.password.invalid_current` | "current password is incorrect" |
| 400 | `shared.method_arguments.validation_failed` | read `errors[].field` / `errors[].code` for field hints |

See [docs/error-codes.md](error-codes.md) for the full catalogue.

---

## 10. Prompt for a frontend AI agent

Copy-paste this as the system/task prompt when asking an AI agent to implement login in the SPA:

```
You are implementing authentication for ONE of the two BikeRental SPAs against an OAuth 2.1 / OpenID Connect
backend (Spring Authorization Server, issuer http://localhost:8080). Pick the client for the app you build:
  - Admin console:  client_id "bike-rental-admin",    origin http://localhost:4201
  - Operator app:   client_id "bike-rental-operator", origin http://localhost:4202

Requirements:
1. Use a certified OIDC library (oidc-client-ts for React/Vue/vanilla, angular-auth-oidc-client for Angular).
   Do NOT hand-roll PKCE, token endpoints, or token storage.
2. Configure a PUBLIC client with the client_id/origin above: Authorization Code flow with PKCE (S256),
   redirect_uri {origin}/login/callback, post_logout_redirect_uri {origin},
   scope "openid profile", authority/issuer http://localhost:8080 (load config from the discovery document).
3. Implement: a Login action (signinRedirect), the /login/callback route (signinRedirectCallback),
   silent refresh, and logout (signoutRedirect). The backend hosts the login page including "Sign in with Google";
   the SPA must NOT collect passwords itself.
4. Add an HTTP interceptor that attaches `Authorization: Bearer <access_token>` to every request to /api/**.
   On 401, try one silent refresh, then redirect to login.
5. Decode the access token (UI gating only): read `roles` (array) to show ADMIN vs OPERATOR features, `uid`,
   and `must_change_password`. If `must_change_password` is true, force the user to a change-password screen that
   POSTs /api/auth/password { currentPassword, newPassword } and then refreshes the token.
6. Password policy in the UI: 8–20 chars, at least one letter and one digit (backend enforces it too).
7. Handle errors by reading the ProblemDetail `errorCode` field (e.g. identity.access.denied -> 403 screen,
   identity.username.duplicate / identity.email.duplicate -> form field errors, validation errors via errors[]).
8. Admin user-management screens call /api/auth/users (POST/GET/PUT), /api/auth/users/{id}/reset-password and
   /api/auth/users/{id}/deactivate. Show the one-time temporaryPassword returned by create/reset. Never call a delete
   endpoint — accounts are deactivated, not deleted.

Never store tokens in code, never log them, and treat all authorization decisions as server-authoritative.
```
