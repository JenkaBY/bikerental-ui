# bikerental-ui — Angular 21 multi-project Point-of-Sale workspace for a bike rental shop

## Summary

- Three independently deployable browser SPAs (`gateway`, `admin`, `operator`) plus one shared Angular library (`shared`) in a single Angular 21 workspace; no SSR, no NgModules, no NgRx.
- `gateway` is a static application chooser served at the site root; `admin` is a desktop-first CRUD/analytics back office; `operator` is a mobile-first PWA driving the rental lifecycle (create → sign → active → return).
- Every runtime component talks to one Spring Boot backend over HTTP through an `ng-openapi`-generated client in `projects/shared/src/core/api/generated/`; there is no local database and no direct `HttpClient` use for spec-covered endpoints.
- State lives in class-based signal stores under `projects/shared/src/core/state/` — global lookups are `providedIn: 'root'`, feature stores are provided on the parent page component so sibling children share one instance.
- Cross-cutting concerns are shared-library singletons: OIDC auth (`angular-auth-oidc-client`), RFC 7807 error parsing/notification, `Accept-Language` injection, backend health polling, SSE-driven time travel, and `$localize` i18n in `en-US` (source) + `ru`.

---

## Projects and Folder Map

- PATH: `projects/gateway/`
  PURPOSE: Landing SPA — locale-aware application chooser linking to admin and operator; no auth, no store, no service worker
  ENTRY_FILES: `projects/gateway/src/main.ts`, `projects/gateway/src/app/app.config.ts`, `projects/gateway/src/app/app.routes.ts`, `projects/gateway/src/index.html`

- PATH: `projects/admin/`
  PURPOSE: Desktop-first back office — equipment, equipment types, tariffs, agreement templates, customers, rentals, transactions, damage reports, users, rental points (registry + status lifecycle), revenue/customer analytics
  ENTRY_FILES: `projects/admin/src/main.ts`, `projects/admin/src/app/app.config.ts`, `projects/admin/src/app/app.routes.ts`, `projects/admin/src/index.html`

- PATH: `projects/operator/`
  PURPOSE: Mobile-first installable PWA — rental creation wizard, agreement signing, active-rental dashboard, QR-scan equipment return, damage reporting, read-only toolbar label for the operator's rental point (or "no working point assigned")
  ENTRY_FILES: `projects/operator/src/main.ts`, `projects/operator/src/app/app.config.ts`, `projects/operator/src/app/app.routes.ts`, `projects/operator/src/index.html`
  PWA_FILES: `projects/operator/ngsw-config.json`, `projects/operator/public/manifest.webmanifest`, `projects/operator/public/icons/`, `projects/operator/src/app/core/pwa-update.service.ts`

- PATH: `projects/shared/`
  PURPOSE: Angular library consumed by all three SPAs via the `@bikerental/shared` barrel
  ENTRY_FILES: `projects/shared/src/public-api.ts`, `projects/shared/src/app.tokens.ts`

- PATH: `projects/shared/src/core/api/generated/`
  PURPOSE: `ng-openapi` output — raw request/response interfaces, one service per backend tag, base-path tokens, `provideDefaultClient()`; never edited by hand, excluded from lint and coverage
  ENTRY_FILES: `services/index.ts`, `models/index.ts`, `providers.ts`, `tokens/index.ts`, `utils/base-interceptor.ts`

- PATH: `projects/shared/src/core/api/event-source/`
  PURPOSE: Server-Sent Events abstraction (`SSE_PROVIDER` token + `SseService`) used by time travel
  ENTRY_FILES: `sse-provider.token.ts`, `sse-provider.service.ts`

- PATH: `projects/shared/src/core/auth/`
  PURPOSE: OIDC wiring, bearer-token interceptor, route guards, password-policy validators, forbidden/change-password screens
  ENTRY_FILES: `auth.config.ts`, `auth.service.ts`, `auth.interceptor.ts`, `auth.guard.ts`, `admin.guard.ts`, `operator.guard.ts`, `must-change-password.guard.ts`, `customer-profile.guard.ts`, `index.ts`

- PATH: `projects/shared/src/core/errors/`
  PURPOSE: RFC 7807 `ProblemDetail` → typed `ApiError`, localized message catalog keyed by backend error code, snackbar facade, form server-error binding, suppression context token
  ENTRY_FILES: `api-error.parser.ts`, `api-error.model.ts`, `error-code.ts`, `error-messages.ts`, `error-message.resolver.ts`, `notification.service.ts`, `server-errors.util.ts`, `http-error-context.ts`, `index.ts`

- PATH: `projects/shared/src/core/interceptors/`
  PURPOSE: Global error interception + last-error signal, `Accept-Language` header injection
  ENTRY_FILES: `error.interceptor.ts`, `error.service.ts`, `accept-language.interceptor.ts`

- PATH: `projects/shared/src/core/health/`
  PURPOSE: Actuator health/info polling exposed as signals
  ENTRY_FILES: `health.service.ts`, `health-poller.service.ts`, `health.model.ts`

- PATH: `projects/shared/src/core/mappers/`
  PURPOSE: Static converter classes `XyzMapper.fromResponse()` / `.toRequest()` between generated API shapes and UI domain models
  ENTRY_FILES: `index.ts` (24 mapper modules)

- PATH: `projects/shared/src/core/models/`
  PURPOSE: UI domain interfaces — the only types components and dialogs import
  ENTRY_FILES: `index.ts` (20 model modules)

- PATH: `projects/shared/src/core/state/`
  PURPOSE: Signal stores, derived/validation stores, refresh facades, revenue report sources, DI tokens
  ENTRY_FILES: exported through `public-api.ts` (47 store/service/token modules)

- PATH: `projects/shared/src/shared/components/`
  PURPOSE: Reusable standalone UI — layout shells, page primitives, badges, dialogs, customer profile routes, damage-report routes, profile-settings routes, QR scanner, signature pad
  ENTRY_FILES: `shell/`, `sidebar/`, `app-toolbar/`, `page-header/`, `segmented-tabs/`, `customer/profile-page/customer-profile.routes.ts`, `damage-report/damage-report.routes.ts`, `profile-settings/profile-settings.routes.ts`

- PATH: `projects/shared/src/shared/constant/`, `projects/shared/src/shared/validators/`, `projects/shared/src/shared/pipes/`, `projects/shared/src/shared/directives/`, `projects/shared/src/shared/utils/`
  PURPOSE: `$localize` label catalogs, reactive-form validators + messages, display pipes, input-masking directives, deployed-URL/date/money helpers
  ENTRY_FILES: `constant/labels.ts`, `validators/form-error-messages.ts`, `utils/deployed-path.ts`

- PATH: `projects/shared/src/environments/`
  PURPOSE: Build-time configuration swapped by `fileReplacements`
  ENTRY_FILES: `environment.ts`, `environment.prod.ts`, `environment.staging.ts`, `environment.lan.ts`

- PATH: `projects/shared/src/locale/`
  PURPOSE: The workspace's only locale directory — `messages.xlf` (generated English source) and `messages.ru.xlf` (hand-maintained Russian)
  ENTRY_FILES: `messages.xlf`, `messages.ru.xlf`

- PATH: `projects/shared/config/`
  PURPOSE: `ng-openapi` generator configuration
  ENTRY_FILES: `openapi.config.ts`

- PATH: `scripts/`
  PURPOSE: Build-pipeline node scripts — app/locale registry, Caddy routing generation, XLF merge, service-worker hash verification
  ENTRY_FILES: `apps.mjs`, `gen-ui-config.mjs`, `merge-xlf.mjs`, `verify-ngsw-integrity.mjs`

- PATH: `docker/`
  PURPOSE: Production container image (Caddy serving the pre-built tree)
  ENTRY_FILES: `Dockerfile`, `Caddyfile.generated` (generated at build time)

- PATH: `.github/workflows/`
  PURPOSE: CI/CD — lint, type-check, test, dual-target build, GitHub Pages deploy, GHCR image publish, production-host dispatch
  ENTRY_FILES: `build-and-deploy.yml`

- PATH: `requirements/`
  PURPOSE: Spec-Driven Development artifacts (`fr.md`, `design.md`, `task-*.md`, `checklist.md`) per requirement
  ENTRY_FILES: `_index.md`

---

## Components

### Application roots and layouts

COMPONENT_NAME: GatewayApp
TYPE: Gateway
PURPOSE: Root component of the gateway SPA.
RESPONSIBILITIES:
  - Render the router outlet for the single home route.
SOURCE: `projects/gateway/src/app/app.ts`
CALLS:
  - HomeComponent — rendered through the router outlet.
CALLED_BY:
  - NONE

COMPONENT_NAME: HomeComponent
TYPE: Gateway
PURPOSE: Locale-aware application chooser that hard-navigates to the admin or operator SPA.
RESPONSIBILITIES:
  - Read `document.baseURI` and `LOCALE_ID` to derive the deployed URL prefix.
  - Build the target URL with `DeployedPath.fromBase().withApp().withLocale()`.
  - Navigate by assigning `document.location.href` (cross-SPA hop, not Angular routing).
SOURCE: `projects/gateway/src/app/features/home/home.component.ts`
CALLS:
  - DeployedPath — build the prefix/app/locale URL without guessing segments.
  - localeSegment — map the Angular locale code to a URL segment.
  - DashboardCardComponent — render the two application cards.
CALLED_BY:
  - GatewayRoutes

COMPONENT_NAME: AdminApp
TYPE: Gateway
PURPOSE: Root component of the admin SPA.
RESPONSIBILITIES:
  - Render the router outlet.
SOURCE: `projects/admin/src/app/app.ts`
CALLS:
  - AdminLayoutComponent — rendered for every guarded route.
CALLED_BY:
  - NONE

COMPONENT_NAME: AdminLayoutComponent
TYPE: Gateway
PURPOSE: Authenticated admin shell hosting sidenav navigation, toolbar and the feature router outlet.
RESPONSIBILITIES:
  - Declare the admin navigation items and brand.
  - Expose logout to the toolbar.
SOURCE: `projects/admin/src/app/layout/admin-layout.component.ts`
CALLS:
  - AuthService — `logout()`.
  - ShellComponent — layout with sidenav and toolbar.
  - HealthIndicatorComponent — backend status pill.
  - ProfileMenuComponent — avatar menu and settings link.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: OperatorApp
TYPE: Gateway
PURPOSE: Root component of the operator SPA.
RESPONSIBILITIES:
  - Render the router outlet.
SOURCE: `projects/operator/src/app/app.ts`
CALLS:
  - OperatorLayoutComponent — rendered for every guarded route.
CALLED_BY:
  - NONE

COMPONENT_NAME: OperatorLayoutComponent
TYPE: Gateway
PURPOSE: Authenticated operator shell with top toolbar and bottom tab navigation.
RESPONSIBILITIES:
  - Declare the bottom navigation items (`rentals`, `rentals/new`, `return`).
  - Expose logout to the toolbar.
SOURCE: `projects/operator/src/app/layout/operator-layout.component.ts`
CALLS:
  - AuthService — `logout()`.
  - AppToolbarComponent — title bar, time-travel display, logout.
  - BottomNavComponent — mobile tab bar.
  - HealthIndicatorComponent — backend status pill.
  - ProfileMenuComponent — avatar menu and settings link.
CALLED_BY:
  - OperatorRoutes

### Generated API clients

COMPONENT_NAME: AgreementsService
TYPE: API
PURPOSE: Generated client for agreement endpoints — templates, PDF preview, rental agreement, signing, signature download.
RESPONSIBILITIES:
  - Issue typed HTTP requests against agreement endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/agreements.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - AgreementTemplateStore
  - AgreementSigningStore
  - RentalSignatureStore

COMPONENT_NAME: AnalyticsService
TYPE: API
PURPOSE: Generated client for analytics endpoints — operator/equipment revenue, customer summary, ranked customers, equipment breakdown.
RESPONSIBILITIES:
  - Issue typed HTTP requests against analytics endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/analytics.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - OperatorRevenueSource
  - EquipmentTypeRevenueSource
  - EquipmentUnitRevenueSource
  - CustomerAnalyticsStore
  - CustomerEquipmentBreakdownStore

COMPONENT_NAME: CustomersService
TYPE: API
PURPOSE: Generated client for customer endpoints — search by phone, get by id, batch fetch, create, update.
RESPONSIBILITIES:
  - Issue typed HTTP requests against customer endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/customers.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - CustomerStore
  - CustomerListStore
  - RentalStore
  - RentalListStore
  - RentalSearchStore
  - BatchRentalPropertyStore
  - TransactionSearchStore
  - TransactionDetailsStore
  - DamageReportStore
  - CustomerAnalyticsStore
  - CustomerEquipmentBreakdownStore

COMPONENT_NAME: EquipmentsCatalogueService
TYPE: API
PURPOSE: Generated client for the equipment catalogue — paged search, batch fetch, create, update.
RESPONSIBILITIES:
  - Issue typed HTTP requests against equipment endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/equipmentsCatalogue.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - EquipmentStore
  - EquipmentUnitOptionsStore
  - EquipmentUnitLabelStore
  - BatchRentalPropertyStore
  - RentalListStore
  - RentalSearchStore
  - DamageReportDetailStore

COMPONENT_NAME: EquipmentTypesService
TYPE: API
PURPOSE: Generated client for equipment-type CRUD.
RESPONSIBILITIES:
  - Issue typed HTTP requests against equipment-type endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/equipmentTypes.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - EquipmentTypeStore

COMPONENT_NAME: FinanceService
TYPE: API
PURPOSE: Generated client for balances, deposits, withdrawals, transaction history, transaction search and details.
RESPONSIBILITIES:
  - Issue typed HTTP requests against finance endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/finance.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - CustomerFinanceStore
  - CustomerTransactionsStore
  - RentalTransactionsStore
  - ReturnEquipmentCostStore
  - TransactionSearchStore
  - TransactionDetailsStore

COMPONENT_NAME: IdentityService
TYPE: API
PURPOSE: Generated client for identity endpoints exposed by the backend.
RESPONSIBILITIES:
  - Issue typed HTTP requests against identity endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/identity.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - NONE

COMPONENT_NAME: MaintenanceService
TYPE: API
PURPOSE: Generated client for damage reports and penalties.
RESPONSIBILITIES:
  - Issue typed HTTP requests against maintenance endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/maintenance.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - DamageReportStore
  - DamageReportDetailStore
  - DamageReportCreateStore

COMPONENT_NAME: RentalsService
TYPE: API
PURPOSE: Generated client for the rental lifecycle — search, detail, create, equipment add/return, pricing update, cancel, debt write-off, available equipment.
RESPONSIBILITIES:
  - Issue typed HTTP requests against rental endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/rentals.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - RentalStore
  - RentalListStore
  - RentalSearchStore
  - RentalLookupStore
  - EquipmentSearchStore
  - EquipmentScanResolverService

COMPONENT_NAME: TariffsService
TYPE: API
PURPOSE: Generated client for tariffs, pricing types, cost calculation and cost quotes.
RESPONSIBILITIES:
  - Issue typed HTTP requests against tariff endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/tariffs.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - TariffStore
  - PricingTypeStore

COMPONENT_NAME: TimeTravelControllerService
TYPE: API
PURPOSE: Generated client for the development time-travel endpoints.
RESPONSIBILITIES:
  - Set and reset the simulated server clock.
SOURCE: `projects/shared/src/core/api/generated/services/timeTravelController.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - TimeTravelStore

COMPONENT_NAME: RentalPointsService
TYPE: API
PURPOSE: Generated client for the rental point registry (register, update, change status, search, get).
RESPONSIBILITIES:
  - Issue typed HTTP requests against `/api/points` endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/rentalPoints.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - PointAdminStore (admin `/admin/points` master-detail page)
  - CurrentPointStore (operator toolbar label; ACTIVE points loaded at startup — server-scoped to the operator's own point; the client never sends a working point)

COMPONENT_NAME: UsersService
TYPE: API
PURPOSE: Generated client for user administration, current-user profile, settings and password change.
RESPONSIBILITIES:
  - Issue typed HTTP requests against user endpoints.
SOURCE: `projects/shared/src/core/api/generated/services/users.service.ts`
CALLS:
  - HttpClient — transport.
CALLED_BY:
  - AuthService
  - ProfileStore
  - ManagedUserStore
  - TransactionDetailsStore
  - ChangePasswordComponent

COMPONENT_NAME: DefaultBaseInterceptor
TYPE: Utility
PURPOSE: Generated class interceptor that prefixes the configured base path onto generated-client requests.
RESPONSIBILITIES:
  - Resolve `BASE_PATH_DEFAULT` and rewrite outgoing request URLs.
SOURCE: `projects/shared/src/core/api/generated/utils/base-interceptor.ts`
CALLS:
  - NONE
CALLED_BY:
  - provideDefaultClient

### Cross-cutting services — auth, errors, health, SSE

COMPONENT_NAME: AuthService
TYPE: Service
PURPOSE: OIDC session facade exposing authentication state, roles and the current user as signals.
RESPONSIBILITIES:
  - Run `checkAuth()` at startup and expose `isAuthenticated`, `roles`, `uid`, `isAdmin`, `isOperator`, `mustChangePassword`.
  - Decode access-token claims via `readAccessTokenClaims`.
  - Load the current user profile into `UserStore` on login and clear it on logout.
  - Start login/logout redirects and token refresh.
SOURCE: `projects/shared/src/core/auth/auth.service.ts`
CALLS:
  - OidcSecurityService — authorization, token access, logoff.
  - UsersService — fetch the current user profile.
  - UserStore — `setUser()` / `clearUser()`.
  - Router — redirect after authentication events.
CALLED_BY:
  - AdminAppConfig
  - AdminLayoutComponent
  - ChangePasswordComponent
  - ForbiddenComponent
  - OperatorAppConfig
  - OperatorLayoutComponent
  - SKIP_AUTH_RETRY
  - adminGuard
  - authGuard
  - customerProfileGuard
  - mustChangePasswordGuard
  - operatorGuard

COMPONENT_NAME: provideOidcAuth
TYPE: Utility
PURPOSE: Environment-provider factory configuring `angular-auth-oidc-client` per SPA client id.
RESPONSIBILITIES:
  - Build the OIDC configuration from `environment.apiUrl` and the supplied client id.
  - Purge stale well-known endpoint entries from `sessionStorage` before configuring.
SOURCE: `projects/shared/src/core/auth/auth.config.ts`
CALLS:
  - NONE
CALLED_BY:
  - AdminAppConfig
  - OperatorAppConfig

COMPONENT_NAME: apiAuthInterceptor
TYPE: Utility
PURPOSE: Attaches the OIDC bearer token to API requests and retries once after a refresh on 401.
RESPONSIBILITIES:
  - Skip non-API and `SKIP_AUTH_RETRY`-tagged requests.
  - Append the `Authorization: Bearer` header.
  - Refresh the session and replay the request when the backend answers 401.
SOURCE: `projects/shared/src/core/auth/auth.interceptor.ts`
CALLS:
  - OidcSecurityService — read the current access token.
  - AuthService — `refresh()` on 401.
CALLED_BY:
  - AdminAppConfig
  - OperatorAppConfig
  - errorInterceptor

COMPONENT_NAME: authGuard
TYPE: Utility
PURPOSE: Route guard requiring an authenticated session.
RESPONSIBILITIES:
  - Allow activation when authenticated, otherwise start the login redirect with the attempted URL.
SOURCE: `projects/shared/src/core/auth/auth.guard.ts`
CALLS:
  - AuthService — `isAuthenticated`, `login(returnUrl)`.
CALLED_BY:
  - AdminRoutes
  - OperatorRoutes

COMPONENT_NAME: adminGuard
TYPE: Utility
PURPOSE: Route guard requiring the admin role.
RESPONSIBILITIES:
  - Redirect to `/forbidden` when the session lacks the admin role.
SOURCE: `projects/shared/src/core/auth/admin.guard.ts`
CALLS:
  - AuthService — `isAdmin`.
  - Router — build the `/forbidden` UrlTree.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: operatorGuard
TYPE: Utility
PURPOSE: Route guard requiring the operator role.
RESPONSIBILITIES:
  - Redirect to `/forbidden` when the session lacks the operator role.
SOURCE: `projects/shared/src/core/auth/operator.guard.ts`
CALLS:
  - AuthService — `isOperator`.
  - Router — build the `/forbidden` UrlTree.
CALLED_BY:
  - OperatorRoutes

COMPONENT_NAME: customerProfileGuard
TYPE: Utility
PURPOSE: Route guard protecting the shared customer-profile routes.
RESPONSIBILITIES:
  - Allow operators and admins; redirect everyone else to the app root.
SOURCE: `projects/shared/src/core/auth/customer-profile.guard.ts`
CALLS:
  - AuthService — `isOperator`, `isAdmin`.
  - Router — build the root UrlTree.
CALLED_BY:
  - OperatorRoutes

COMPONENT_NAME: mustChangePasswordGuard
TYPE: Utility
PURPOSE: Route guard forcing a password change before any feature route.
RESPONSIBILITIES:
  - Redirect to `/change-password` while the `mustChangePassword` claim is set.
SOURCE: `projects/shared/src/core/auth/must-change-password.guard.ts`
CALLS:
  - AuthService — `mustChangePassword`.
  - Router — build the `/change-password` UrlTree.
CALLED_BY:
  - AdminRoutes
  - OperatorRoutes

COMPONENT_NAME: ChangePasswordComponent
TYPE: Utility
PURPOSE: Standalone screen for changing the current user's password.
RESPONSIBILITIES:
  - Validate the new password against the shared password policy.
  - Submit the change and notify success or failure.
SOURCE: `projects/shared/src/core/auth/change-password.component.ts`
CALLS:
  - UsersService — change password.
  - AuthService — refresh session state after the change.
  - NotificationService — success and error toasts.
  - ErrorMessageResolver — localized failure copy.
CALLED_BY:
  - AdminRoutes
  - OperatorRoutes

COMPONENT_NAME: ForbiddenComponent
TYPE: Utility
PURPOSE: Access-denied screen shown when a role guard rejects activation.
RESPONSIBILITIES:
  - Display the denial message and a logout affordance.
SOURCE: `projects/shared/src/core/auth/forbidden.component.ts`
CALLS:
  - AuthService — read identity, log out.
CALLED_BY:
  - AdminRoutes
  - OperatorRoutes

COMPONENT_NAME: ApiErrorParser
TYPE: Utility
PURPOSE: Static parser turning any thrown transport error into a typed `ApiError`.
RESPONSIBILITIES:
  - Map `HttpErrorResponse` RFC 7807 bodies to code, kind, status, detail, field errors, params and trace id.
  - Classify errors as validation, domain, system or network (status 0).
SOURCE: `projects/shared/src/core/errors/api-error.parser.ts`
CALLS:
  - NONE
CALLED_BY:
  - AddEquipmentDialogComponent
  - AgreementDialogComponent
  - AgreementListComponent
  - AnalyticsRevenueStore
  - ChangePasswordComponent
  - ChangePriceSheetComponent
  - CustomerAnalyticsStore
  - CustomerEquipmentBreakdownStore
  - DamageReportDetailStore
  - ProfileSecurityComponent
  - ProfileStore
  - RentalActionButtonsComponent
  - RentalAgreementComponent
  - RentalDetailPanelComponent
  - RentalHistoryCardListComponent
  - RentalSignatureStore
  - RentalStep2Component
  - RentalTransactionsStore
  - ReportDamageSheetComponent
  - ReturnEquipmentScreenComponent
  - TransactionDetailsStore
  - UserCreateDialogComponent
  - UserEditDialogComponent
  - UsersListComponent
  - errorInterceptor

COMPONENT_NAME: ErrorMessageResolver
TYPE: Service
PURPOSE: Resolves a typed `ApiError` into localized user-facing copy.
RESPONSIBILITIES:
  - Look up `ErrorMessageCatalog` by backend error code, falling back to status then generic copy.
  - Resolve individual field errors for form binding and summaries.
SOURCE: `projects/shared/src/core/errors/error-message.resolver.ts`
CALLS:
  - ErrorMessages — the localized catalog and status fallbacks.
CALLED_BY:
  - AddEquipmentDialogComponent
  - ChangePasswordComponent
  - ChangePriceSheetComponent
  - ProfileSecurityComponent
  - ProfileStore
  - RentalActionButtonsComponent
  - RentalDetailPanelComponent
  - RentalHistoryCardListComponent
  - ReportDamageSheetComponent
  - ReturnEquipmentScreenComponent
  - UsersListComponent
  - errorInterceptor

COMPONENT_NAME: NotificationService
TYPE: Service
PURPOSE: The single sanctioned snackbar facade for user-facing messages.
RESPONSIBILITIES:
  - Expose `success()`, `info()`, `warn()` and `error()` with severity-specific styling and duration.
SOURCE: `projects/shared/src/core/errors/notification.service.ts`
CALLS:
  - MatSnackBar — render the toast.
CALLED_BY:
  - AddEquipmentDialogComponent
  - AgreementDialogComponent
  - AgreementListComponent
  - ChangePasswordComponent
  - ChangePriceSheetComponent
  - ProfileSecurityComponent
  - ProfileStore
  - PwaUpdateService
  - RentalActionButtonsComponent
  - RentalAgreementComponent
  - RentalCostSectionComponent
  - RentalDetailPanelComponent
  - RentalHistoryCardListComponent
  - RentalSignatureStore
  - RentalStep2Component
  - ReportDamageSheetComponent
  - ReturnEquipmentScreenComponent
  - TransactionDetailsStore
  - UserCreateDialogComponent
  - UserEditDialogComponent
  - UsersListComponent
  - errorInterceptor

COMPONENT_NAME: ErrorService
TYPE: Store
PURPOSE: Holds the most recent `ApiError` as a signal for diagnostics.
RESPONSIBILITIES:
  - Store and clear the last intercepted error.
SOURCE: `projects/shared/src/core/interceptors/error.service.ts`
CALLS:
  - NONE
CALLED_BY:
  - errorInterceptor

COMPONENT_NAME: errorInterceptor
TYPE: Utility
PURPOSE: Global HTTP error funnel — parses, records and toasts failures, then rethrows.
RESPONSIBILITIES:
  - Parse every failed response with `ApiErrorParser`.
  - Record it in `ErrorService`.
  - On `scope.not_established` (409): mark `OperatingScopeStore.notEstablished` and warn once — never a login redirect.
  - Otherwise toast the resolved message unless the status is 401 or the request carries `SUPPRESS_ERROR_NOTIFICATION`; client-defect codes (e.g. `scope.caller_supplied`) get the correlation id appended by `ErrorMessageResolver`.
  - Rethrow so callers can still handle the error locally.
SOURCE: `projects/shared/src/core/interceptors/error.interceptor.ts`
CALLS:
  - ApiErrorParser — typed parsing.
  - ErrorService — record the last error.
  - ErrorMessageResolver — localized copy.
  - NotificationService — toast.
CALLED_BY:
  - AdminAppConfig
  - GatewayAppConfig
  - OperatorAppConfig

COMPONENT_NAME: acceptLanguageInterceptor
TYPE: Utility
PURPOSE: Injects the user's locale into API requests.
RESPONSIBILITIES:
  - Set `Accept-Language` from `UserStore.locale()` on API-bound requests only.
SOURCE: `projects/shared/src/core/interceptors/accept-language.interceptor.ts`
CALLS:
  - UserStore — read the active locale.
CALLED_BY:
  - AdminAppConfig
  - GatewayAppConfig
  - OperatorAppConfig

COMPONENT_NAME: HealthService
TYPE: Service
PURPOSE: Queries Spring Boot actuator endpoints and exposes backend status as signals.
RESPONSIBILITIES:
  - Fetch the actuator health and info endpoints.
  - Expose `status`, `components`, `serverInfo`, `lastChecked` and `error`.
SOURCE: `projects/shared/src/core/health/health.service.ts`
CALLS:
  - HttpClient — direct actuator calls (not covered by the OpenAPI spec).
CALLED_BY:
  - HealthIndicatorComponent
  - HealthPollerService

COMPONENT_NAME: HealthPollerService
TYPE: Worker
PURPOSE: Background poller driving periodic health checks for the lifetime of the app.
RESPONSIBILITIES:
  - Run an interval of `environment.healthPollIntervalMs` and trigger a health check on each tick.
SOURCE: `projects/shared/src/core/health/health-poller.service.ts`
CALLS:
  - HealthService — `checkHealth()`.
CALLED_BY:
  - AdminAppConfig
  - GatewayAppConfig
  - OperatorAppConfig

COMPONENT_NAME: SseService
TYPE: Consumer
PURPOSE: Default `SSE_PROVIDER` implementation wrapping the browser `EventSource`.
RESPONSIBILITIES:
  - Open an `EventSource` for a URL and re-enter the Angular zone for each message.
SOURCE: `projects/shared/src/core/api/event-source/sse-provider.service.ts`
CALLS:
  - NgZone — re-enter Angular on message delivery.
CALLED_BY:
  - AdminAppConfig
  - OperatorAppConfig

COMPONENT_NAME: LocaleRedirectService
TYPE: Service
PURPOSE: Performs a hard navigation to the same route under a different locale build.
RESPONSIBILITIES:
  - Rebuild the current URL with `DeployedPath` and the target locale segment, then assign it.
SOURCE: `projects/shared/src/core/locale-redirect.service.ts`
CALLS:
  - DeployedPath — rebuild prefix/app/locale/route.
  - localeSegment — map the locale code.
CALLED_BY:
  - UserStore

COMPONENT_NAME: PwaUpdateService
TYPE: Worker
PURPOSE: Drives the operator service-worker update lifecycle.
RESPONSIBILITIES:
  - Listen for `VERSION_READY`, `VERSION_INSTALLATION_FAILED` and `unrecoverable` events.
  - Check for updates on a 15-minute throttle and on `visibilitychange` to visible.
  - Prompt the user with a confirm dialog, then activate the update and reload.
SOURCE: `projects/operator/src/app/core/pwa-update.service.ts`
CALLS:
  - SwUpdate — version events, `checkForUpdate()`, `activateUpdate()`.
  - ConfirmDialogComponent — reload prompt and unrecoverable-state prompt.
  - NotificationService — update-failure toast.
CALLED_BY:
  - OperatorAppConfig

### Mappers (three-layer data pipeline)

COMPONENT_NAME: AgreementSignatureMapper
TYPE: Utility
PURPOSE: Converts signature responses into signature domain models.
RESPONSIBILITIES:
  - Map created-signature and signature-summary responses.
SOURCE: `projects/shared/src/core/mappers/agreement-signature.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - AgreementSigningStore
  - RentalSignatureStore

COMPONENT_NAME: AgreementTemplateMapper
TYPE: Utility
PURPOSE: Converts agreement-template payloads in both directions.
RESPONSIBILITIES:
  - Map summary, detail, variable and rental-agreement responses.
  - Build template create/update and PDF-preview requests.
SOURCE: `projects/shared/src/core/mappers/agreement-template.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - AgreementSigningStore
  - AgreementTemplateStore

COMPONENT_NAME: AnalyticsCustomerMapper
TYPE: Utility
PURPOSE: Converts customer analytics responses into domain models.
RESPONSIBILITIES:
  - Map customer summary, ranked-spend pages and equipment breakdowns.
SOURCE: `projects/shared/src/core/mappers/analytics-customer.mapper.ts`
CALLS:
  - PageMapper — wrap paged spend rows.
CALLED_BY:
  - CustomerAnalyticsStore
  - CustomerEquipmentBreakdownStore

COMPONENT_NAME: AnalyticsRevenueMapper
TYPE: Utility
PURPOSE: Converts revenue report responses into a single `RevenueReport` shape per dimension.
RESPONSIBILITIES:
  - Map revenue metrics and generic bucket structures.
  - Map operator, equipment-type and equipment-unit reports.
SOURCE: `projects/shared/src/core/mappers/analytics-revenue.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - AnalyticsCustomerMapper
  - EquipmentTypeRevenueSource
  - EquipmentUnitRevenueSource
  - OperatorRevenueSource

COMPONENT_NAME: BalanceMapper
TYPE: Utility
PURPOSE: Converts account-balance responses into `CustomerBalance`.
RESPONSIBILITIES:
  - Map balance envelopes to the domain balance model.
SOURCE: `projects/shared/src/core/mappers/balance.mapper.ts`
CALLS:
  - makeMoney — build `Money` values.
CALLED_BY:
  - CustomerFinanceStore

COMPONENT_NAME: CustomerFinanceMapper
TYPE: Utility
PURPOSE: Builds deposit and withdrawal request bodies.
RESPONSIBILITIES:
  - Map `CustomerDepositWrite` and `CustomerWithdrawalWrite` to requests.
SOURCE: `projects/shared/src/core/mappers/customer-finance.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerFinanceStore

COMPONENT_NAME: CustomerMapper
TYPE: Utility
PURPOSE: Converts customer responses and write models.
RESPONSIBILITIES:
  - Map detail and search responses to `Customer`.
  - Build the customer create/update request.
SOURCE: `projects/shared/src/core/mappers/customer.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - BatchRentalPropertyStore
  - CustomerListStore
  - CustomerStore
  - RentalStore

COMPONENT_NAME: DamageReportMapper
TYPE: Utility
PURPOSE: Converts damage-report payloads in both directions.
RESPONSIBILITIES:
  - Map detail and summary responses.
  - Build the register-damage-report request.
SOURCE: `projects/shared/src/core/mappers/damage-report.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - DamageReportCreateStore
  - DamageReportDetailStore
  - DamageReportStore

COMPONENT_NAME: EquipmentConditionMapper
TYPE: Utility
PURPOSE: Resolves equipment-condition slugs to localized condition descriptors.
RESPONSIBILITIES:
  - Expose the condition catalogue and slug lookups.
SOURCE: `projects/shared/src/core/mappers/equipment-condition.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - DamageReportMapper
  - EquipmentMapper

COMPONENT_NAME: EquipmentSearchItemMapper
TYPE: Utility
PURPOSE: Converts equipment responses into the search/selection item shape.
RESPONSIBILITIES:
  - Map catalogue and availability responses, enriching with equipment-type names.
SOURCE: `projects/shared/src/core/mappers/equipment-search-item.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - BatchRentalPropertyStore
  - EquipmentScanResolverService
  - EquipmentSearchStore

COMPONENT_NAME: EquipmentTypeMapper
TYPE: Utility
PURPOSE: Converts equipment-type payloads in both directions.
RESPONSIBILITIES:
  - Map responses to `EquipmentType` and build create/update requests.
SOURCE: `projects/shared/src/core/mappers/equipment-type.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - EquipmentTypeStore

COMPONENT_NAME: EquipmentUnitViewModelMapper
TYPE: Utility
PURPOSE: Builds the presentation view model consumed by the equipment-unit card components.
RESPONSIBILITIES:
  - Project search items and rental equipment items into a single card view model.
SOURCE: `projects/shared/src/core/mappers/equipment-unit-view-model.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalDetailPanelComponent
  - RentalEquipmentSectionComponent
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: EquipmentMapper
TYPE: Utility
PURPOSE: Converts equipment payloads in both directions.
RESPONSIBILITIES:
  - Map catalogue responses to `Equipment` and build the write request.
SOURCE: `projects/shared/src/core/mappers/equipment.mapper.ts`
CALLS:
  - EquipmentConditionMapper — resolve the condition descriptor.
CALLED_BY:
  - EquipmentStore
  - EquipmentUnitOptionsStore

COMPONENT_NAME: ManagedUserMapper
TYPE: Utility
PURPOSE: Converts user-administration payloads in both directions.
RESPONSIBILITIES:
  - Map user responses and creation results; build create/update requests.
SOURCE: `projects/shared/src/core/mappers/managed-user.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - ManagedUserStore

COMPONENT_NAME: makeMoney
TYPE: Utility
PURPOSE: Free function constructing the `Money` value object with the default currency.
RESPONSIBILITIES:
  - Pair an amount with a currency symbol.
SOURCE: `projects/shared/src/core/mappers/money.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - AnalyticsRevenueMapper
  - AnalyticsRevenueStore
  - BalanceMapper
  - CostCalculationMapper
  - DamageReportMapper
  - RentalCostCalculationStore
  - RentalDashboardMapper
  - RentalMapper
  - RentalPriceControlComponent
  - RentalStore
  - RentalTransactionsStore
  - RentalValidationStore
  - ReturnEquipmentCostStore
  - TransactionListItemComponent
  - TransactionMapper

COMPONENT_NAME: PageMapper
TYPE: Utility
PURPOSE: Generic paged-envelope converter.
RESPONSIBILITIES:
  - Map an API page plus an item mapper into the domain `Page<T>`.
SOURCE: `projects/shared/src/core/mappers/page.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - AnalyticsCustomerMapper
  - DamageReportStore

COMPONENT_NAME: PricingTypeMapper
TYPE: Utility
PURPOSE: Converts pricing-type responses.
RESPONSIBILITIES:
  - Map responses to `PricingType`.
SOURCE: `projects/shared/src/core/mappers/pricing-type.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - PricingTypeStore

COMPONENT_NAME: RentalDashboardMapper
TYPE: Utility
PURPOSE: Converts rental payloads for list, detail, return and pricing flows.
RESPONSIBILITIES:
  - Build list items from summaries plus customer and equipment-name lookups.
  - Build the rental detail state and rental equipment items.
  - Build return, confirm-return and pricing requests.
SOURCE: `projects/shared/src/core/mappers/rental-dashboard.mapper.ts`
CALLS:
  - makeMoney — build monetary fields.
CALLED_BY:
  - RentalListStore
  - RentalStore

COMPONENT_NAME: RentalMapper
TYPE: Utility
PURPOSE: Converts rental summaries and the rental create request.
RESPONSIBILITIES:
  - Map rental summaries to `CustomerRentalSummary`.
  - Build the rental create request from `RentalWrite`.
SOURCE: `projects/shared/src/core/mappers/rental.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalSearchStore
  - RentalStore

COMPONENT_NAME: CostCalculationMapper
TYPE: Utility
PURPOSE: The only injectable mapper — builds cost-calculation requests and parses estimates and quotes.
RESPONSIBILITIES:
  - Build the calculation request from the draft, resolving the special tariff id.
  - Stamp the simulated clock into the request when time travel is active.
  - Map calculation and quote responses to `RentalCostEstimate` / `RentalCostQuote`.
SOURCE: `projects/shared/src/core/mappers/cost-calculation.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalCostCalculationStore
  - RentalPricingStore
  - ReturnEquipmentCostStore

COMPONENT_NAME: TariffMapper
TYPE: Utility
PURPOSE: Converts tariff payloads in both directions.
RESPONSIBILITIES:
  - Map responses to `Tariff`, resolving equipment types and pricing types.
  - Build the tariff write request.
SOURCE: `projects/shared/src/core/mappers/tariff.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - TariffStore

COMPONENT_NAME: TransactionMapper
TYPE: Utility
PURPOSE: Converts transaction payloads for history, search and detail views.
RESPONSIBILITIES:
  - Map transaction items, summaries and details.
  - Derive the latest hold amount from a transaction list.
SOURCE: `projects/shared/src/core/mappers/transaction.mapper.ts`
CALLS:
  - makeMoney — build monetary fields.
CALLED_BY:
  - CustomerTransactionsStore
  - RentalTransactionsStore
  - ReturnEquipmentCostStore
  - TransactionDetailsStore
  - TransactionSearchStore

COMPONENT_NAME: UserProfileMapper
TYPE: Utility
PURPOSE: Converts the current-user response into `UserProfile`.
RESPONSIBILITIES:
  - Map identity and account-status fields.
SOURCE: `projects/shared/src/core/mappers/user-profile.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - AuthService

COMPONENT_NAME: UserSettingsMapper
TYPE: Utility
PURPOSE: Converts user settings and preferences in both directions.
RESPONSIBILITIES:
  - Map user responses and raw settings records to `UserSettings`.
  - Build the settings patch request.
SOURCE: `projects/shared/src/core/mappers/user-settings.mapper.ts`
CALLS:
  - NONE
CALLED_BY:
  - AuthService
  - ProfileStore
  - UserStore

### Global stores (providedIn: 'root')

COMPONENT_NAME: UserStore
TYPE: Store
PURPOSE: Holds the authenticated user profile, settings and effective locale.
RESPONSIBILITIES:
  - Expose `currentUser`, `isAuthenticated`, `userRoles`, `settings`, `preferences`, `locale`.
  - Cache settings in `localStorage` under `user_settings` and restore them on boot.
  - Trigger a locale redirect when the preferred locale differs from the running build.
SOURCE: `projects/shared/src/core/state/user.store.ts`
CALLS:
  - UserSettingsMapper — normalize stored and fetched settings.
  - LocaleRedirectService — hard-navigate to the matching locale build.
CALLED_BY:
  - AuthService
  - ProfileAccountComponent
  - ProfileMenuComponent
  - ProfilePreferencesComponent
  - ProfileStore
  - UsersListComponent
  - acceptLanguageInterceptor

COMPONENT_NAME: ProfileStore
TYPE: Store
PURPOSE: Writes the current user's profile, preferences and password.
RESPONSIBILITIES:
  - Save profile fields and preference patches, updating `UserStore` on success.
  - Change the password, letting the error reach the caller.
  - Honour `PROFILE_STUB_MODE` where no backend endpoint exists.
SOURCE: `projects/shared/src/core/state/profile.store.ts`
CALLS:
  - UsersService — persist profile, settings and password.
  - UserStore — apply the saved settings.
  - NotificationService — report settings failures.
  - ErrorMessageResolver — localized failure copy.
  - UserSettingsMapper — build request and response shapes.
CALLED_BY:
  - ProfileAccountComponent
  - ProfilePreferencesComponent
  - ProfileSecurityComponent

COMPONENT_NAME: EquipmentTypeStore
TYPE: Store
PURPOSE: Global equipment-type lookup and CRUD.
RESPONSIBILITIES:
  - Load and cache all equipment types as signals.
  - Expose `typesForEquipment` (special-tariff types filtered out).
  - Create and update equipment types.
SOURCE: `projects/shared/src/core/state/equipment-type.store.ts`
CALLS:
  - EquipmentTypesService — list, create, update.
  - EquipmentTypeMapper — response/request conversion.
CALLED_BY:
  - CustomerEquipmentBreakdownStore
  - EquipmentListComponent
  - EquipmentScanResolverService
  - EquipmentSearchStore
  - EquipmentStore
  - EquipmentTypeDialogComponent
  - EquipmentTypeDropdownComponent
  - EquipmentTypeListComponent
  - EquipmentTypeRevenueSource
  - EquipmentTypeSelectComponent
  - EquipmentUnitOptionsStore
  - LookupInitializerFacade
  - TariffStore

COMPONENT_NAME: PricingTypeStore
TYPE: Store
PURPOSE: Global pricing-type lookup.
RESPONSIBILITIES:
  - Load and cache pricing types for tariff forms.
SOURCE: `projects/shared/src/core/state/pricing-type.store.ts`
CALLS:
  - TariffsService — fetch pricing types.
  - PricingTypeMapper — response conversion.
CALLED_BY:
  - LookupInitializerFacade
  - TariffDialogComponent
  - TariffStore

COMPONENT_NAME: EquipmentStore
TYPE: Store
PURPOSE: Paged, filtered equipment catalogue with create/update.
RESPONSIBILITIES:
  - Hold page index, page size, type filter and condition filters.
  - Load the current page and expose items, total and busy flags.
  - Create and update equipment units.
SOURCE: `projects/shared/src/core/state/equipment.store.ts`
CALLS:
  - EquipmentsCatalogueService — search, create, update.
  - EquipmentMapper — response/request conversion.
  - EquipmentTypeStore — resolve type names onto equipment.
CALLED_BY:
  - EquipmentDialogComponent
  - EquipmentListComponent

COMPONENT_NAME: EquipmentUnitLabelStore
TYPE: Cache
PURPOSE: Lazily resolves equipment ids to display labels and caches them.
RESPONSIBILITIES:
  - Batch-fetch missing ids and build `uid — model` labels.
  - Serve labels from cache for analytics tables.
SOURCE: `projects/shared/src/core/state/equipment-unit-label.store.ts`
CALLS:
  - EquipmentsCatalogueService — batch fetch.
CALLED_BY:
  - CustomerEquipmentBreakdownStore
  - EquipmentUnitRevenueSource

COMPONENT_NAME: EquipmentScanResolverService
TYPE: Service
PURPOSE: Resolves a scanned equipment UID to an available equipment item.
RESPONSIBILITIES:
  - Query available equipment by UID and return an exact match or null.
SOURCE: `projects/shared/src/core/state/equipment-scan-resolver.service.ts`
CALLS:
  - RentalsService — available-equipment search.
  - EquipmentSearchItemMapper — response conversion.
  - EquipmentTypeStore — enrich with type names.
CALLED_BY:
  - RentalEquipmentSectionComponent

COMPONENT_NAME: TariffStore
TYPE: Store
PURPOSE: Tariff CRUD plus the cost-calculation and quote gateway used by every pricing surface.
RESPONSIBILITIES:
  - Load paged tariffs, create, update, activate and deactivate.
  - Resolve and expose the special tariff id.
  - Proxy `calculateCost`, `createQuote` and `deleteQuote` to the backend.
SOURCE: `projects/shared/src/core/state/tariff.store.ts`
CALLS:
  - TariffsService — tariff CRUD, cost calculation, quotes.
  - TariffMapper — response/request conversion.
  - EquipmentTypeStore — resolve equipment-type names.
  - PricingTypeStore — resolve pricing-type names.
CALLED_BY:
  - LookupInitializerFacade
  - RentalCostCalculationStore
  - RentalPricingStore
  - RentalStore
  - ReturnEquipmentCostStore
  - TariffDialogComponent
  - TariffListComponent

COMPONENT_NAME: ManagedUserStore
TYPE: Store
PURPOSE: Administration of application users.
RESPONSIBILITIES:
  - List users; create, update, deactivate and reset passwords.
  - Let callers control error suppression through request options.
SOURCE: `projects/shared/src/core/state/managed-user.store.ts`
CALLS:
  - UsersService — user administration endpoints.
  - ManagedUserMapper — response/request conversion.
CALLED_BY:
  - OperatorRevenueSource
  - OperatorSelectComponent
  - UserCreateDialogComponent
  - UserEditDialogComponent
  - UsersListComponent

COMPONENT_NAME: TimeTravelStore
TYPE: Store
PURPOSE: Development-only simulated clock synchronized over SSE.
RESPONSIBILITIES:
  - Subscribe to the time-travel SSE stream and expose `serverTime` / `uiTime`.
  - Set and reset the simulated server time.
SOURCE: `projects/shared/src/core/state/time-travel.store.ts`
CALLS:
  - TimeTravelControllerService — set and reset the clock.
CALLED_BY:
  - AdminAppConfig
  - AppToolbarComponent
  - OperatorAppConfig
  - TIME_TRAVEL_STORE_TOKEN

COMPONENT_NAME: TimeStore
TYPE: Store
PURPOSE: Single source of "now" for the whole UI.
RESPONSIBILITIES:
  - Return the simulated clock when time travel is enabled, otherwise the real clock.
SOURCE: `projects/shared/src/core/state/time.store.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalDetailPanelComponent
  - RentalEquipmentSectionComponent
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: CustomerRatingService
TYPE: Service
PURPOSE: Customer rating lookup (stub — always returns the maximum rating).
RESPONSIBILITIES:
  - Return a rating for a customer id.
SOURCE: `projects/shared/src/core/state/customer-rating.service.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerDetailComponent
  - RentalCustomerPanelComponent

COMPONENT_NAME: LookupInitializerFacade
TYPE: Utility
PURPOSE: Startup fan-out that warms the global lookup stores.
RESPONSIBILITIES:
  - Load equipment types, pricing types and the special tariff id per the supplied config.
  - Isolate each task so one failure cannot block the others.
SOURCE: `projects/shared/src/core/state/lookup-initializer.facade.ts`
CALLS:
  - EquipmentTypeStore — `load()`.
  - PricingTypeStore — `load()`.
  - TariffStore — `resolveSpecialTariff()`.
CALLED_BY:
  - AdminAppConfig
  - OperatorAppConfig

COMPONENT_NAME: OperatorRevenueSource
TYPE: Service
PURPOSE: Revenue report source keyed by operator.
RESPONSIBILITIES:
  - Load the operator revenue report and resolve operator display names.
SOURCE: `projects/shared/src/core/state/operator-revenue.source.ts`
CALLS:
  - AnalyticsService — operator revenue endpoint.
  - AnalyticsRevenueMapper — response conversion.
  - ManagedUserStore — operator names.
CALLED_BY:
  - AnalyticsPageComponent

COMPONENT_NAME: EquipmentTypeRevenueSource
TYPE: Service
PURPOSE: Revenue report source keyed by equipment type.
RESPONSIBILITIES:
  - Load the equipment-type revenue report and resolve type names.
SOURCE: `projects/shared/src/core/state/equipment-type-revenue.source.ts`
CALLS:
  - AnalyticsService — equipment-type revenue endpoint.
  - AnalyticsRevenueMapper — response conversion.
  - EquipmentTypeStore — type names.
CALLED_BY:
  - AnalyticsPageComponent

COMPONENT_NAME: EquipmentUnitRevenueSource
TYPE: Service
PURPOSE: Revenue report source keyed by individual equipment unit; requires a type scope.
RESPONSIBILITIES:
  - Load the equipment-unit revenue report and resolve unit labels.
SOURCE: `projects/shared/src/core/state/equipment-unit-revenue.source.ts`
CALLS:
  - AnalyticsService — equipment revenue endpoint.
  - AnalyticsRevenueMapper — response conversion.
  - EquipmentUnitLabelStore — unit labels.
CALLED_BY:
  - AnalyticsPageComponent

### Feature-scoped stores (provided on a parent component)

COMPONENT_NAME: CustomerStore
TYPE: Store
PURPOSE: Single-customer load and write.
RESPONSIBILITIES:
  - Load a customer by id; create and update customers.
SOURCE: `projects/shared/src/core/state/customer.store.ts`
CALLS:
  - CustomersService — get, create, update.
  - CustomerMapper — response/request conversion.
CALLED_BY:
  - CustomerCreateDialogComponent
  - CustomerCreateInlineFormComponent
  - CustomerDetailComponent
  - CustomerLayoutStore
  - CustomerProfileComponent

COMPONENT_NAME: CustomerListStore
TYPE: Store
PURPOSE: Debounced phone-number customer search backing every customer autocomplete.
RESPONSIBILITIES:
  - Normalize the query to digits, require a minimum length and debounce it.
  - Expose results and loading state from an `rxResource`.
SOURCE: `projects/shared/src/core/state/customer-list.store.ts`
CALLS:
  - CustomersService — search by phone.
  - CustomerMapper — search-response conversion.
CALLED_BY:
  - CustomerListComponent
  - CustomerSearchInputComponent
  - RentalFilterComponent
  - TransactionFilterComponent

COMPONENT_NAME: CustomerFinanceStore
TYPE: Store
PURPOSE: Customer balance plus deposit and withdrawal commands.
RESPONSIBILITIES:
  - Load and refresh the balance for the current customer.
  - Record deposits and withdrawals.
SOURCE: `projects/shared/src/core/state/customer-finance.store.ts`
CALLS:
  - FinanceService — balances, deposit, withdrawal.
  - BalanceMapper — balance conversion.
  - CustomerFinanceMapper — request construction.
CALLED_BY:
  - CustomerAccountComponent
  - CustomerDetailComponent
  - CustomerLayoutStore
  - RentalAgreementComponent
  - RentalCreateComponent
  - RentalDetailComponent
  - RentalDetailPageComponent
  - RentalDetailRefreshFacade
  - RentalListComponent
  - RentalStep2Component
  - RentalStore
  - RentalValidationStore
  - ReturnEquipmentScreenComponent
  - TopUpDialogComponent
  - WithdrawDialogComponent

COMPONENT_NAME: CustomerLayoutStore
TYPE: Store
PURPOSE: Facade binding the customer profile route to its child stores.
RESPONSIBILITIES:
  - Initialize customer and finance state from the route id.
  - Re-expose customer, balance and a combined loading flag.
SOURCE: `projects/shared/src/core/state/customer-layout.store.ts`
CALLS:
  - CustomerStore — load the customer.
  - CustomerFinanceStore — load the balance.
CALLED_BY:
  - CustomerAccountComponent
  - CustomerDetailComponent
  - CustomerPenaltiesComponent
  - CustomerProfileComponent
  - CustomerRentalsComponent
  - CustomerTransactionsStore

COMPONENT_NAME: CustomerTransactionsStore
TYPE: Store
PURPOSE: Paged transaction history for one customer.
RESPONSIBILITIES:
  - Load and page the customer's transactions; invalidate after a balance change.
SOURCE: `projects/shared/src/core/state/customer-transactions.store.ts`
CALLS:
  - FinanceService — transaction history.
  - TransactionMapper — item conversion.
  - CustomerLayoutStore — the active customer id.
CALLED_BY:
  - CustomerAccountComponent
  - CustomerDetailComponent
  - CustomerTransactionsComponent

COMPONENT_NAME: RentalStore
TYPE: Store
PURPOSE: The rental aggregate — draft composition, lifecycle transitions and detail state for create, detail, agreement and return flows.
RESPONSIBILITIES:
  - Hold customer, equipment items, duration, price mode, discount and fixed price.
  - Expose derived lifecycle state (draft, awaiting signature, active, debt, overdue) and monetary totals.
  - Save the draft, send to signing, cancel signing, cancel the rental and write off debt.
  - Add equipment to an active rental, update pricing, return equipment and confirm the return against a quote.
  - Track the equipment selection used by the return flow.
SOURCE: `projects/shared/src/core/state/rental.store.ts`
CALLS:
  - RentalsService — rental lifecycle endpoints.
  - CustomersService — customer hydration.
  - BatchRentalPropertyStore — batch customer and equipment resolution for detail load.
  - CustomerFinanceStore — balance refresh after money moves.
  - TariffStore — special tariff id for pricing requests.
  - RentalMapper — rental request construction.
  - RentalDashboardMapper — detail state, return and pricing requests.
  - CustomerMapper — customer conversion.
  - makeMoney — monetary fields.
CALLED_BY:
  - AddEquipmentDialogComponent
  - RentalActionButtonsComponent
  - RentalAgreementComponent
  - RentalCostCalculationStore
  - RentalCostFooterComponent
  - RentalCostSectionComponent
  - RentalCreateComponent
  - RentalDamageReportsSectionComponent
  - RentalDetailComponent
  - RentalDetailPageComponent
  - RentalDetailPanelComponent
  - RentalDetailRefreshFacade
  - RentalDetailSummaryComponent
  - RentalDurationControlComponent
  - RentalEquipmentSectionComponent
  - RentalListComponent
  - RentalPeriodSectionComponent
  - RentalPricingStore
  - RentalStep1Component
  - RentalStep2Component
  - RentalTransactionsSectionComponent
  - RentalTransactionsStore
  - RentalValidationStore
  - ReturnEquipmentCostStore
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: BatchRentalPropertyStore
TYPE: Store
PURPOSE: Batch resolver for the customer and equipment units referenced by a rental.
RESPONSIBILITIES:
  - Fetch one customer and a batch of equipment units in parallel.
  - Expose the combined result plus loading and error flags.
SOURCE: `projects/shared/src/core/state/batch-rental-property.store.ts`
CALLS:
  - CustomersService — customer by id.
  - EquipmentsCatalogueService — batch equipment fetch.
  - CustomerMapper — customer conversion.
  - EquipmentSearchItemMapper — equipment conversion.
CALLED_BY:
  - RentalAgreementComponent
  - RentalCreateComponent
  - RentalDetailComponent
  - RentalDetailPageComponent
  - RentalListComponent
  - RentalStore

COMPONENT_NAME: RentalValidationStore
TYPE: Store
PURPOSE: Derived-only store answering whether the rental can proceed.
RESPONSIBILITIES:
  - Compute the projected balance, balance sufficiency, shortfall and `canProceed`.
SOURCE: `projects/shared/src/core/state/rental-validation.store.ts`
CALLS:
  - RentalStore — rental draft state.
  - RentalCostCalculationStore — the current estimate.
  - CustomerFinanceStore — the customer balance.
  - makeMoney — monetary fields.
CALLED_BY:
  - RentalBalanceWarningComponent
  - RentalCostFooterComponent
  - RentalCreateComponent
  - RentalStep2Component

COMPONENT_NAME: RentalCostCalculationStore
TYPE: Store
PURPOSE: Debounced live cost estimation for the current rental composition.
RESPONSIBILITIES:
  - Recompute the estimate when equipment, duration or pricing change (300 ms debounce).
  - Expose per-unit breakdowns, returned totals, final-cost flag and busy state.
SOURCE: `projects/shared/src/core/state/rental-cost-calculation.store.ts`
CALLS:
  - TariffStore — `calculateCost()`.
  - RentalStore — draft composition.
  - CostCalculationMapper — request/response conversion.
CALLED_BY:
  - RentalCostFooterComponent
  - RentalCostSectionComponent
  - RentalCreateComponent
  - RentalDetailComponent
  - RentalDetailPageComponent
  - RentalDetailPanelComponent
  - RentalDetailSummaryComponent
  - RentalEquipmentSectionComponent
  - RentalListComponent
  - RentalPricingStore
  - RentalValidationStore

COMPONENT_NAME: RentalPricingStore
TYPE: Store
PURPOSE: Backs the change-price sheet on an active rental.
RESPONSIBILITIES:
  - Hold the pricing draft and quote it live.
  - Submit the pricing change through the rental aggregate.
SOURCE: `projects/shared/src/core/state/rental-pricing.store.ts`
CALLS:
  - RentalStore — `updatePricing()`.
  - TariffStore — `calculateCost()`.
  - RentalCostCalculationStore — returned items and totals.
  - CostCalculationMapper — request/response conversion.
CALLED_BY:
  - ChangePriceSheetComponent

COMPONENT_NAME: ReturnEquipmentCostStore
TYPE: Store
PURPOSE: Drives the quote-based settlement of an equipment return.
RESPONSIBILITIES:
  - Estimate the cost of the selected items live, then switch to quote mode.
  - Create and delete server-side cost quotes.
  - Expose the held amount, per-equipment breakdown and the settlement (refund or charge).
SOURCE: `projects/shared/src/core/state/return-equipment-cost.store.ts`
CALLS:
  - TariffStore — `calculateCost()`, `createQuote()`, `deleteQuote()`.
  - RentalStore — the rental and its selection.
  - FinanceService — transaction history for the held amount.
  - CostCalculationMapper — request/response conversion.
  - TransactionMapper — latest hold amount.
CALLED_BY:
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: RentalTransactionsStore
TYPE: Store
PURPOSE: Transactions attached to the current rental.
RESPONSIBILITIES:
  - Load rental-sourced transactions and expose the reserved amount and outstanding debt.
  - Surface a typed error and its localized message.
SOURCE: `projects/shared/src/core/state/rental-transactions.store.ts`
CALLS:
  - FinanceService — transaction history filtered by rental source.
  - RentalStore — the active rental id.
  - TransactionMapper — item conversion and hold amount.
  - ApiErrorParser — typed error.
CALLED_BY:
  - RentalCostSectionComponent
  - RentalCreateComponent
  - RentalDetailComponent
  - RentalDetailPageComponent
  - RentalDetailRefreshFacade
  - RentalDetailSummaryComponent
  - RentalListComponent
  - RentalReservedPanelComponent
  - RentalTransactionsSectionComponent

COMPONENT_NAME: RentalDetailRefreshFacade
TYPE: Utility
PURPOSE: One entry point for refreshing everything shown on a rental screen.
RESPONSIBILITIES:
  - Refresh the rental, its transactions, the customer balance and damage reports together.
  - Expose a combined `isRefreshing` flag.
SOURCE: `projects/shared/src/core/state/rental-detail-refresh.facade.ts`
CALLS:
  - RentalStore — reload the rental detail.
  - RentalTransactionsStore — reload transactions.
  - CustomerFinanceStore — refresh the balance.
  - DamageReportStore — reload damage reports (optional).
CALLED_BY:
  - AddEquipmentDialogComponent
  - ChangePriceSheetComponent
  - RentalActionButtonsComponent
  - RentalCostSectionComponent
  - RentalCreateComponent
  - RentalDetailComponent
  - RentalEquipmentSectionComponent
  - RentalStep2Component
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: RentalListStore
TYPE: Store
PURPOSE: Operator dashboard lists — active rentals and history.
RESPONSIBILITIES:
  - Load active rentals and date/filter-scoped history.
  - Enrich summaries with customer and equipment names.
  - Write off debt with in-flight tracking per rental id.
SOURCE: `projects/shared/src/core/state/rental-list.store.ts`
CALLS:
  - RentalsService — rental search and debt write-off.
  - CustomersService — batch customer fetch.
  - EquipmentsCatalogueService — batch equipment fetch.
  - RentalDashboardMapper — list-item construction.
CALLED_BY:
  - RentalActiveTabComponent
  - RentalDashboardComponent
  - RentalHistoryCardListComponent
  - RentalHistoryTabComponent

COMPONENT_NAME: RentalSearchStore
TYPE: Store
PURPOSE: Paged rental search for admin and the customer rentals tab.
RESPONSIBILITIES:
  - Run a paged, filtered rental query and expose rows, total and page state.
  - Enrich rows with customer and equipment data, degrading to un-enriched rows on failure.
SOURCE: `projects/shared/src/core/state/rental-search.store.ts`
CALLS:
  - RentalsService — rental search.
  - EquipmentsCatalogueService — batch equipment fetch.
  - CustomersService — batch customer fetch.
  - RentalMapper — summary conversion.
CALLED_BY:
  - CustomerDetailComponent
  - CustomerRentalsComponent
  - RentalListComponent

COMPONENT_NAME: RentalLookupStore
TYPE: Store
PURPOSE: Resolves a scanned equipment UID to the active rental holding it.
RESPONSIBILITIES:
  - Query active rentals by equipment UID and expose found id or not-found.
SOURCE: `projects/shared/src/core/state/rental-lookup.store.ts`
CALLS:
  - RentalsService — active rental search by equipment UID.
CALLED_BY:
  - ReturnComponent

COMPONENT_NAME: RentalSignatureStore
TYPE: Store
PURPOSE: Signature summary and signed-agreement PDF download for a rental.
RESPONSIBILITIES:
  - Load the signature summary.
  - Download the signed agreement PDF and report failures.
SOURCE: `projects/shared/src/core/state/rental-signature.store.ts`
CALLS:
  - AgreementsService — signature summary and PDF download.
  - AgreementSignatureMapper — summary conversion.
  - NotificationService — download failure toast.
  - ApiErrorParser / ErrorMessageResolver — localized failure copy.
CALLED_BY:
  - RentalAgreementDownloadComponent
  - RentalDetailComponent
  - RentalDetailPageComponent
  - RentalDetailPanelComponent
  - RentalListComponent

COMPONENT_NAME: AgreementSigningStore
TYPE: Store
PURPOSE: Loads the rental agreement text and submits the captured signature.
RESPONSIBILITIES:
  - Fetch the rendered agreement for a rental.
  - Submit the signature PNG together with the rental version.
SOURCE: `projects/shared/src/core/state/agreement-signing.store.ts`
CALLS:
  - AgreementsService — rental agreement, sign.
  - AgreementTemplateMapper — agreement conversion.
  - AgreementSignatureMapper — created-signature conversion.
CALLED_BY:
  - RentalAgreementComponent

COMPONENT_NAME: AgreementTemplateStore
TYPE: Store
PURPOSE: Agreement template administration.
RESPONSIBILITIES:
  - List, sort, fetch, create, update, activate and delete templates.
  - Load substitution variables and render a PDF preview.
  - Track per-template busy ids.
SOURCE: `projects/shared/src/core/state/agreement-template.store.ts`
CALLS:
  - AgreementsService — template CRUD, variables, preview.
  - AgreementTemplateMapper — response/request conversion.
CALLED_BY:
  - AgreementDialogComponent
  - AgreementListComponent

COMPONENT_NAME: DamageReportStore
TYPE: Store
PURPOSE: Paged damage-report search shared by admin history, the rental screen and the customer penalties tab.
RESPONSIBILITIES:
  - Run a paged, filtered search and expose rows, total and page state.
  - Enrich rows with customer references.
  - Expose pending-penalty flags used as a rental warning.
SOURCE: `projects/shared/src/core/state/damage-report.store.ts`
CALLS:
  - MaintenanceService — damage-report search.
  - CustomersService — batch customer fetch.
  - DamageReportMapper — summary conversion.
  - PageMapper — page envelope conversion.
CALLED_BY:
  - CustomerPenaltiesComponent
  - DamageReportHistoryComponent
  - RentalDamageReportsSectionComponent
  - RentalDetailComponent
  - RentalDetailPageComponent
  - RentalDetailRefreshFacade
  - RentalListComponent

COMPONENT_NAME: DamageReportDetailStore
TYPE: Store
PURPOSE: Single damage report with equipment names resolved.
RESPONSIBILITIES:
  - Load one report and enrich its items with equipment labels.
  - Expose a typed error for the detail screen.
SOURCE: `projects/shared/src/core/state/damage-report-detail.store.ts`
CALLS:
  - MaintenanceService — damage report by id.
  - EquipmentsCatalogueService — batch equipment fetch.
  - DamageReportMapper — response conversion.
  - ApiErrorParser — typed error.
CALLED_BY:
  - DamageReportDetailComponent

COMPONENT_NAME: DamageReportCreateStore
TYPE: Store
PURPOSE: Registers a damage report from the operator bottom sheet.
RESPONSIBILITIES:
  - Submit the report with an idempotency key and expose the saving flag.
SOURCE: `projects/shared/src/core/state/damage-report-create.store.ts`
CALLS:
  - MaintenanceService — register damage report.
  - DamageReportMapper — request/response conversion.
CALLED_BY:
  - ReportDamageSheetComponent

COMPONENT_NAME: TransactionSearchStore
TYPE: Store
PURPOSE: Paged transaction search for the admin transaction history.
RESPONSIBILITIES:
  - Run a paged, filtered query and expose rows, total and page state.
  - Enrich rows with customer references.
SOURCE: `projects/shared/src/core/state/transaction-search.store.ts`
CALLS:
  - FinanceService — transaction search.
  - CustomersService — batch customer fetch.
  - TransactionMapper — summary conversion.
CALLED_BY:
  - TransactionHistoryComponent

COMPONENT_NAME: TransactionDetailsStore
TYPE: Store
PURPOSE: Single transaction with its customer and operator resolved.
RESPONSIBILITIES:
  - Load the transaction, its customer and the acting operator.
  - Degrade gracefully when either lookup fails and toast a top-level failure.
SOURCE: `projects/shared/src/core/state/transaction-details.store.ts`
CALLS:
  - FinanceService — transaction details.
  - CustomersService — customer by id.
  - UsersService — operator by id.
  - TransactionMapper — details conversion.
  - NotificationService / ApiErrorParser / ErrorMessageResolver — failure reporting.
CALLED_BY:
  - TransactionDetailsPageComponent

COMPONENT_NAME: EquipmentSearchStore
TYPE: Store
PURPOSE: Debounced availability search used while composing a rental.
RESPONSIBILITIES:
  - Debounce the query, require a minimum length and expose results.
  - Track the applied query for highlighting.
SOURCE: `projects/shared/src/core/state/equipment-search.store.ts`
CALLS:
  - RentalsService — available-equipment search.
  - EquipmentSearchItemMapper — response conversion.
  - EquipmentTypeStore — enrich with type names.
CALLED_BY:
  - RentalEquipmentSectionComponent

COMPONENT_NAME: EquipmentUnitOptionsStore
TYPE: Store
PURPOSE: Equipment-unit options for the analytics unit selector.
RESPONSIBILITIES:
  - Load units for a given type slug as select options.
SOURCE: `projects/shared/src/core/state/equipment-unit-options.store.ts`
CALLS:
  - EquipmentsCatalogueService — equipment search.
  - EquipmentMapper — response conversion.
  - EquipmentTypeStore — resolve type names.
CALLED_BY:
  - EquipmentUnitSelectComponent

COMPONENT_NAME: AnalyticsRevenueStore
TYPE: Store
PURPOSE: Revenue report state machine over the pluggable report sources.
RESPONSIBILITIES:
  - Select the active report source, query and metric.
  - Expose buckets, totals, dimension keys, unattributed values and a typed error.
SOURCE: `projects/shared/src/core/state/analytics-revenue.store.ts`
CALLS:
  - ApiErrorParser — typed error.
  - makeMoney — monetary fields.
CALLED_BY:
  - RevenueReportPanelComponent

COMPONENT_NAME: CustomerAnalyticsStore
TYPE: Store
PURPOSE: Customer analytics summary plus the ranked-spend list.
RESPONSIBILITIES:
  - Load the summary and the paged, sorted spend list for a date range.
  - Enrich spend rows with customer references.
  - Expose separate typed errors for summary and list.
SOURCE: `projects/shared/src/core/state/customer-analytics.store.ts`
CALLS:
  - AnalyticsService — customer summary and ranked customers.
  - CustomersService — batch customer fetch.
  - AnalyticsCustomerMapper — response conversion.
  - ApiErrorParser — typed errors.
CALLED_BY:
  - CustomerAnalyticsPanelComponent

COMPONENT_NAME: CustomerEquipmentBreakdownStore
TYPE: Store
PURPOSE: Per-customer equipment revenue breakdown (drill-down target).
RESPONSIBILITIES:
  - Load the breakdown for a customer and range.
  - Resolve equipment-type and equipment-unit display names.
SOURCE: `projects/shared/src/core/state/customer-equipment-breakdown.store.ts`
CALLS:
  - AnalyticsService — customer equipment breakdown.
  - CustomersService — batch customer fetch.
  - AnalyticsCustomerMapper — response conversion.
  - EquipmentTypeStore — type names.
  - EquipmentUnitLabelStore — unit labels.
  - ApiErrorParser — typed error.
CALLED_BY:
  - CustomerEquipmentBreakdownComponent

### Admin feature components

COMPONENT_NAME: EquipmentListComponent
TYPE: Gateway
PURPOSE: Paged, filtered equipment catalogue table with create/edit dialogs.
RESPONSIBILITIES:
  - Drive page, type filter and condition filters on the store.
  - Open the equipment dialog and reload on a truthy result.
SOURCE: `projects/admin/src/app/equipment/equipment-list.component.ts`
CALLS:
  - EquipmentStore — `load()`, `setFilterType()`, `setFilterConditions()`, `setPage()`, items/total/page signals.
  - EquipmentTypeStore — `types()`, `typesForEquipment()`.
  - EquipmentDialogComponent — create and edit.
  - EquipmentConditionFilterComponent — condition filter control.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: EquipmentDialogComponent
TYPE: Gateway
PURPOSE: Create/edit dialog for an equipment unit.
RESPONSIBILITIES:
  - Build the reactive form from `MAT_DIALOG_DATA`.
  - Create or update and close with `true` on success.
SOURCE: `projects/admin/src/app/equipment/equipment-dialog.component.ts`
CALLS:
  - EquipmentStore — `create()`, `update()`, `saving`.
  - MatSnackBar — failure message.
  - EquipmentTypeDropdownComponent — type selection.
CALLED_BY:
  - EquipmentListComponent

COMPONENT_NAME: EquipmentTypeListComponent
TYPE: Gateway
PURPOSE: Equipment-type table with create/edit dialogs.
RESPONSIBILITIES:
  - Render the cached types and open the type dialog.
SOURCE: `projects/admin/src/app/equipment-types/equipment-type-list.component.ts`
CALLS:
  - EquipmentTypeStore — `types()`, `loading()`.
  - EquipmentTypeDialogComponent — create and edit.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: EquipmentTypeDialogComponent
TYPE: Gateway
PURPOSE: Create/edit dialog for an equipment type.
RESPONSIBILITIES:
  - Validate slug and name with the shared validators.
  - Create or update and close with `true` on success.
SOURCE: `projects/admin/src/app/equipment-types/equipment-type-dialog.component.ts`
CALLS:
  - EquipmentTypeStore — `create()`, `update()`, `saving`.
  - MatSnackBar — failure message.
CALLED_BY:
  - EquipmentTypeListComponent

COMPONENT_NAME: TariffListComponent
TYPE: Gateway
PURPOSE: Paged tariff table with activation control and create/edit dialogs.
RESPONSIBILITIES:
  - Page the tariff list; activate and deactivate tariffs.
  - Open the tariff dialog and reload on success.
SOURCE: `projects/admin/src/app/tariffs/tariff-list.component.ts`
CALLS:
  - TariffStore — `load()`, `setPage()`, `activate()`, `deactivate()`, list signals.
  - TariffDialogComponent — create and edit.
  - MatSnackBar — action feedback.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: TariffDialogComponent
TYPE: Gateway
PURPOSE: Create/edit dialog for a tariff, switching parameter sub-forms by pricing type.
RESPONSIBILITIES:
  - Build the tariff form and swap the parameter group per pricing type.
  - Create or update and close with `true` on success.
SOURCE: `projects/admin/src/app/tariffs/tariff-dialog.component.ts`
CALLS:
  - TariffStore — `create()`, `update()`, `saving()`.
  - PricingTypeStore — `pricingTypes()`.
  - DailyParamsComponent / DegressiveHourlyParamsComponent / FlatFeeParamsComponent / FlatHourlyParamsComponent / SpecialParamsComponent — per-pricing-type parameter forms.
  - EquipmentTypeDropdownComponent — equipment-type selection.
  - MatSnackBar — failure message.
CALLED_BY:
  - TariffListComponent

COMPONENT_NAME: DailyParamsComponent
TYPE: Utility
PURPOSE: Parameter sub-form for the daily pricing type.
RESPONSIBILITIES:
  - Render and validate the daily-tariff controls of the supplied form group.
SOURCE: `projects/admin/src/app/tariffs/daily-params.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - TariffDialogComponent

COMPONENT_NAME: DegressiveHourlyParamsComponent
TYPE: Utility
PURPOSE: Parameter sub-form for the degressive-hourly pricing type.
RESPONSIBILITIES:
  - Render and validate the degressive-hourly controls of the supplied form group.
SOURCE: `projects/admin/src/app/tariffs/degressive-hourly-params.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - TariffDialogComponent

COMPONENT_NAME: FlatFeeParamsComponent
TYPE: Utility
PURPOSE: Parameter sub-form for the flat-fee pricing type.
RESPONSIBILITIES:
  - Render and validate the flat-fee controls of the supplied form group.
SOURCE: `projects/admin/src/app/tariffs/flat-fee-params.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - TariffDialogComponent

COMPONENT_NAME: FlatHourlyParamsComponent
TYPE: Utility
PURPOSE: Parameter sub-form for the flat-hourly pricing type.
RESPONSIBILITIES:
  - Render and validate the flat-hourly controls of the supplied form group.
SOURCE: `projects/admin/src/app/tariffs/flat-hourly-params.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - TariffDialogComponent

COMPONENT_NAME: SpecialParamsComponent
TYPE: Utility
PURPOSE: Descriptive placeholder for the special (parameterless) pricing type.
RESPONSIBILITIES:
  - Render the pricing-type description.
SOURCE: `projects/admin/src/app/tariffs/special-params.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - TariffDialogComponent

COMPONENT_NAME: AgreementListComponent
TYPE: Gateway
PURPOSE: Agreement-template table with activation, deletion and the editor dialog.
RESPONSIBILITIES:
  - Sort and render templates; activate, delete and create.
  - Confirm destructive actions and report outcomes.
SOURCE: `projects/admin/src/app/agreements/agreement-list.component.ts`
CALLS:
  - AgreementTemplateStore — `load()`, `activate()`, `delete()`, `create()`, sort signals.
  - AgreementDialogComponent — create and edit.
  - ConfirmDialogComponent — destructive confirmation.
  - NotificationService — success and failure toasts.
  - ApiErrorParser / ErrorMessageResolver — localized failure copy.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: AgreementDialogComponent
TYPE: Gateway
PURPOSE: Editor dialog for an agreement template with variable insertion and PDF preview.
RESPONSIBILITIES:
  - Load the template detail and available substitution variables.
  - Insert variables at the caret and save create/update.
  - Request a PDF preview and open the preview dialog.
SOURCE: `projects/admin/src/app/agreements/agreement-dialog.component.ts`
CALLS:
  - AgreementTemplateStore — `getById()`, `loadVariables()`, `create()`, `update()`, `previewPdf()`.
  - AgreementPdfPreviewDialogComponent — render the preview blob.
  - NotificationService — success and failure toasts.
CALLED_BY:
  - AgreementListComponent

COMPONENT_NAME: AgreementPdfPreviewDialogComponent
TYPE: Gateway
PURPOSE: Displays a generated agreement PDF in an iframe.
RESPONSIBILITIES:
  - Create and revoke an object URL for the blob.
  - Bypass sanitization for the iframe resource URL.
SOURCE: `projects/admin/src/app/agreements/agreement-pdf-preview-dialog.component.ts`
CALLS:
  - DomSanitizer — trust the blob resource URL.
CALLED_BY:
  - AgreementDialogComponent

COMPONENT_NAME: CustomerListComponent
TYPE: Gateway
PURPOSE: Customer search list with navigation into the shared customer profile.
RESPONSIBILITIES:
  - Search customers by phone and navigate to the profile route.
  - Open the shared create dialog.
SOURCE: `projects/admin/src/app/customers/customer-list.component.ts`
CALLS:
  - CustomerListStore — `search()`, `customers()`, `loading()`.
  - CustomerCreateDialogComponent — create a customer.
  - Router — navigate to `/customers/:id`.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: RentalListComponent
TYPE: Gateway
PURPOSE: Admin rental history — filter, table and an inline detail panel.
RESPONSIBILITIES:
  - Run the paged rental search from the filter value and URL state.
  - Load the selected rental into the ambient rental store for the side panel.
SOURCE: `projects/admin/src/app/rentals/rental-history.component.ts`
CALLS:
  - RentalSearchStore — `search()`, `items()`, `reload()`.
  - RentalStore — `reset()`, `loadDetail()`.
  - RentalTableComponent — row rendering and sorting.
  - RentalFilterComponent — filter inputs.
  - RentalDetailPanelComponent — inline detail.
  - Router — write filter and selection into the URL.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: RentalDetailPageComponent
TYPE: Gateway
PURPOSE: Full-page admin rental detail addressed by route id.
RESPONSIBILITIES:
  - Load the rental detail for the bound route input.
  - Host the detail panel and provide the rental store graph.
SOURCE: `projects/admin/src/app/rentals/rental-detail-page.component.ts`
CALLS:
  - RentalStore — `loadDetail()`.
  - RentalDetailPanelComponent — the detail body.
  - Location — back navigation.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: RentalDetailPanelComponent
TYPE: Gateway
PURPOSE: Admin rental detail body — summary, equipment, transactions, damage reports and lifecycle actions.
RESPONSIBILITIES:
  - Render the rental identity, period, equipment and cost sections.
  - Write off debt and cancel the rental behind a confirmation.
  - Load the signature summary for the agreement download.
SOURCE: `projects/admin/src/app/rentals/rental-detail-panel.component.ts`
CALLS:
  - RentalStore — lifecycle signals, `loadDetail()`, `writeOffDebt()`, `cancelRental()`.
  - RentalSignatureStore — `load()`.
  - RentalCostCalculationStore — `breakdowns()`.
  - TimeStore — current time for overdue math.
  - ConfirmDialogComponent — destructive confirmation.
  - NotificationService / ErrorMessageResolver — outcome reporting.
  - RentalDetailSummaryComponent, RentalDamageReportsSectionComponent, RentalTransactionsSectionComponent, RentalPeriodSectionComponent, RentalAgreementDownloadComponent — sections.
CALLED_BY:
  - RentalDetailPageComponent
  - RentalListComponent

COMPONENT_NAME: RentalDetailSummaryComponent
TYPE: Utility
PURPOSE: Cost and customer summary block of the admin rental detail.
RESPONSIBILITIES:
  - Render total cost, final-cost state and the customer reference.
SOURCE: `projects/admin/src/app/rentals/rental-detail-summary.component.ts`
CALLS:
  - RentalStore — `finalCost()`, `customer()`.
  - RentalCostCalculationStore — `totalCost()`, `isFinal()`.
  - RentalTransactionsStore — reserved amount.
CALLED_BY:
  - RentalDetailPanelComponent

COMPONENT_NAME: RentalDamageReportsSectionComponent
TYPE: Utility
PURPOSE: Damage reports attached to the rental.
RESPONSIBILITIES:
  - Search damage reports for the active rental id and render the list.
SOURCE: `projects/admin/src/app/rentals/rental-damage-reports-section.component.ts`
CALLS:
  - DamageReportStore — `search()`, `items()`, `loading()`.
  - RentalStore — the active rental id.
  - DamageReportListItemComponent — row rendering.
CALLED_BY:
  - RentalDetailPanelComponent

COMPONENT_NAME: RentalTransactionsSectionComponent
TYPE: Utility
PURPOSE: Transactions attached to the rental.
RESPONSIBILITIES:
  - Render the rental transaction list.
SOURCE: `projects/admin/src/app/rentals/rental-transactions-section.component.ts`
CALLS:
  - RentalTransactionsStore — `transactions()`, `loading()`.
  - RentalStore — the active rental id.
  - TransactionListItemComponent — row rendering.
CALLED_BY:
  - RentalDetailPanelComponent

COMPONENT_NAME: RentalTableComponent
TYPE: Utility
PURPOSE: Presentational rental table with sorting and row selection.
RESPONSIBILITIES:
  - Render rows and emit `rowSelect` and `sortChange`.
SOURCE: `projects/admin/src/app/rentals/rental-table.component.ts`
CALLS:
  - RentalEquipmentCellComponent — equipment cell.
  - RentalStatusBadgeComponent — status cell.
CALLED_BY:
  - RentalListComponent

COMPONENT_NAME: RentalFilterComponent
TYPE: Utility
PURPOSE: Rental search filter with customer autocomplete and a date range.
RESPONSIBILITIES:
  - Emit `filterChange` with the composed filter value.
SOURCE: `projects/admin/src/app/rentals/rental-filter.component.ts`
CALLS:
  - CustomerListStore — `search()`, `customers()`.
CALLED_BY:
  - RentalListComponent

COMPONENT_NAME: RentalEquipmentCellComponent
TYPE: Utility
PURPOSE: Compact equipment summary cell for the rental table.
RESPONSIBILITIES:
  - Render the equipment badges of a rental row.
SOURCE: `projects/admin/src/app/rentals/rental-equipment-cell.component.ts`
CALLS:
  - EquipmentBadgeComponent — badge rendering.
CALLED_BY:
  - RentalTableComponent

COMPONENT_NAME: TransactionHistoryComponent
TYPE: Gateway
PURPOSE: Admin transaction history with filter, paging and row navigation.
RESPONSIBILITIES:
  - Run the paged transaction search from filter and URL state.
  - Navigate to the transaction details route.
SOURCE: `projects/admin/src/app/transactions/transaction-history.component.ts`
CALLS:
  - TransactionSearchStore — `search()`, `reload()`, `items()`, page signals.
  - TransactionFilterComponent — filter inputs.
  - TransactionListItemComponent — row rendering.
  - Router — URL state and row navigation.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: TransactionDetailsPageComponent
TYPE: Gateway
PURPOSE: Full-page transaction details addressed by route id.
RESPONSIBILITIES:
  - Load the transaction details, customer and operator.
  - Render the details view and provide back navigation.
SOURCE: `projects/admin/src/app/transactions/transaction-details-page.component.ts`
CALLS:
  - TransactionDetailsStore — `load()`, `details()`, `customer()`, `operatorName()`.
  - TransactionDetailsViewComponent — details rendering.
  - Location — back navigation.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: TransactionFilterComponent
TYPE: Utility
PURPOSE: Transaction search filter with customer autocomplete, ledger types and a date range.
RESPONSIBILITIES:
  - Emit `filterChange` with the composed filter value.
SOURCE: `projects/admin/src/app/transactions/transaction-filter.component.ts`
CALLS:
  - CustomerListStore — `search()`, `customers()`.
CALLED_BY:
  - TransactionHistoryComponent

COMPONENT_NAME: DamageReportHistoryComponent
TYPE: Gateway
PURPOSE: Admin damage-report history with filter, paging and deep links.
RESPONSIBILITIES:
  - Run the paged damage-report search from filter and URL state.
  - Build cross-app links from `document.baseURI` and navigate to report details.
SOURCE: `projects/admin/src/app/damage-reports/damage-report-history.component.ts`
CALLS:
  - DamageReportStore — `search()`, `reload()`, `items()`, `customer()`, page signals.
  - DamageReportFilterComponent — filter inputs.
  - DeployedPath — build deployed links.
  - Router — URL state and row navigation.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: DamageReportFilterComponent
TYPE: Utility
PURPOSE: Damage-report filter inputs.
RESPONSIBILITIES:
  - Emit `filterChange` with the composed filter value.
SOURCE: `projects/admin/src/app/damage-reports/damage-report-filter.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - DamageReportHistoryComponent

COMPONENT_NAME: UsersListComponent
TYPE: Gateway
PURPOSE: User administration table — create, edit, deactivate, reactivate and reset passwords.
RESPONSIBILITIES:
  - List users and guard actions against the current user.
  - Confirm destructive actions and surface generated temporary passwords.
SOURCE: `projects/admin/src/app/users/users-list.component.ts`
CALLS:
  - ManagedUserStore — `load()`, `update()`, `deactivate()`, `resetPassword()`.
  - UserStore — the current user, to prevent self-lockout.
  - UserCreateDialogComponent / UserEditDialogComponent — user forms.
  - ConfirmDialogComponent — destructive confirmation.
  - TemporaryPasswordDialogComponent — show the generated password.
  - NotificationService / ErrorMessageResolver — failure reporting.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: UserCreateDialogComponent
TYPE: Gateway
PURPOSE: Create-user dialog with role selection and password policy.
RESPONSIBILITIES:
  - Validate the form, submit with error suppression and bind server field errors.
  - Show the temporary password on success.
SOURCE: `projects/admin/src/app/users/user-create-dialog.component.ts`
CALLS:
  - ManagedUserStore — `create()`, `saving`.
  - applyServerErrors / clearServerErrors — bind backend validation errors.
  - TemporaryPasswordDialogComponent — show the generated password.
  - NotificationService — success and failure toasts.
CALLED_BY:
  - UsersListComponent

COMPONENT_NAME: UserEditDialogComponent
TYPE: Gateway
PURPOSE: Edit-user dialog for display name, roles and status.
RESPONSIBILITIES:
  - Submit with error suppression and bind server field errors.
SOURCE: `projects/admin/src/app/users/user-edit-dialog.component.ts`
CALLS:
  - ManagedUserStore — `update()`, `saving`.
  - applyServerErrors / clearServerErrors — bind backend validation errors.
  - NotificationService — failure toast.
CALLED_BY:
  - UsersListComponent

COMPONENT_NAME: AnalyticsPageComponent
TYPE: Gateway
PURPOSE: Analytics container owning tab, range and drill-down state in the URL.
RESPONSIBILITIES:
  - Provide the `REVENUE_REPORT_SOURCES` multi-source array.
  - Mirror tab, range, paging, sort and selected customer into query params.
  - Delegate refresh to the active panel.
SOURCE: `projects/admin/src/app/analytics/analytics-page.component.ts`
CALLS:
  - OperatorRevenueSource / EquipmentTypeRevenueSource / EquipmentUnitRevenueSource — provided as the source array.
  - RevenueReportPanelComponent — revenue tabs.
  - CustomerAnalyticsPanelComponent — customer tab.
  - Router — URL state.
CALLED_BY:
  - AdminRoutes

COMPONENT_NAME: RevenueReportPanelComponent
TYPE: Gateway
PURPOSE: One revenue report — filter, chart, totals and bucket table.
RESPONSIBILITIES:
  - Push report id, query and metric into the store and render the result.
  - Emit drill-down requests for selectable rows.
SOURCE: `projects/admin/src/app/analytics/revenue-report-panel.component.ts`
CALLS:
  - AnalyticsRevenueStore — `setReportId()`, `setQuery()`, `setMetric()`, `reload()`, report signals.
  - RevenueFilterComponent, RevenueChartComponent, RevenueTotalsComponent, RevenueBucketTableComponent — presentation.
CALLED_BY:
  - AnalyticsPageComponent

COMPONENT_NAME: RevenueFilterComponent
TYPE: Utility
PURPOSE: Revenue report filter — date range, granularity, metric and scope selectors.
RESPONSIBILITIES:
  - Emit `filterChange` with the composed value.
SOURCE: `projects/admin/src/app/analytics/revenue-filter.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - AnalyticsPageComponent

COMPONENT_NAME: RevenueChartComponent
TYPE: Utility
PURPOSE: ECharts bar/line chart of revenue buckets.
RESPONSIBILITIES:
  - Build the chart option from buckets, granularity, metric and dimension keys.
SOURCE: `projects/admin/src/app/analytics/revenue-chart.component.ts`
CALLS:
  - echarts-setup — registered ECharts modules through `provideEchartsCore`.
CALLED_BY:
  - RevenueReportPanelComponent

COMPONENT_NAME: RevenueBucketTableComponent
TYPE: Utility
PURPOSE: Tabular revenue buckets with optional row selection.
RESPONSIBILITIES:
  - Render bucket rows, metric columns and unattributed hints; emit `rowSelect`.
SOURCE: `projects/admin/src/app/analytics/revenue-bucket-table.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RevenueReportPanelComponent

COMPONENT_NAME: RevenueTotalsComponent
TYPE: Utility
PURPOSE: Totals row of metric tiles for a revenue report.
RESPONSIBILITIES:
  - Render one tile per metric key.
SOURCE: `projects/admin/src/app/analytics/revenue-totals.component.ts`
CALLS:
  - RevenueMetricTileComponent — tile rendering.
CALLED_BY:
  - CustomerEquipmentBreakdownComponent
  - CustomerSummaryPanelComponent
  - RevenueReportPanelComponent

COMPONENT_NAME: RevenueMetricTileComponent
TYPE: Utility
PURPOSE: Single labelled metric value tile.
RESPONSIBILITIES:
  - Render label, hint and value.
SOURCE: `projects/admin/src/app/analytics/revenue-metric-tile.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RevenueTotalsComponent

COMPONENT_NAME: CustomerAnalyticsPanelComponent
TYPE: Gateway
PURPOSE: Customer analytics tab — summary tiles, chart and ranked spend table.
RESPONSIBILITIES:
  - Push range, list state and chart metric into the store.
  - Emit paging, sorting and customer-selection events upward.
SOURCE: `projects/admin/src/app/analytics/customer-analytics-panel.component.ts`
CALLS:
  - CustomerAnalyticsStore — `setRange()`, `setList()`, `setChartMetric()`, `reload()`.
  - CustomerSummaryPanelComponent, CustomerSummaryChartComponent, CustomerSpendTableComponent — presentation.
CALLED_BY:
  - AnalyticsPageComponent

COMPONENT_NAME: CustomerEquipmentBreakdownComponent
TYPE: Gateway
PURPOSE: Drill-down showing one customer's equipment revenue breakdown.
RESPONSIBILITIES:
  - Push range and customer id into the store and render the breakdown.
  - Emit `back` to return to the ranked list.
SOURCE: `projects/admin/src/app/analytics/customer-equipment-breakdown.component.ts`
CALLS:
  - CustomerEquipmentBreakdownStore — `setRange()`, `setCustomerId()`, `reload()`, `typeNameFor()`, `unitNameFor()`.
  - CustomerEquipmentTableComponent — table rendering.
CALLED_BY:
  - CustomerAnalyticsPanelComponent

COMPONENT_NAME: CustomerEquipmentTableComponent
TYPE: Utility
PURPOSE: Nested type/unit revenue table for the customer drill-down.
RESPONSIBILITIES:
  - Render equipment types with their unit rows and metric columns.
SOURCE: `projects/admin/src/app/analytics/customer-equipment-table.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerEquipmentBreakdownComponent

COMPONENT_NAME: CustomerSpendTableComponent
TYPE: Utility
PURPOSE: Ranked customer spend table with sorting and row selection.
RESPONSIBILITIES:
  - Render spend rows; emit `sortChange` and `rowSelect`.
SOURCE: `projects/admin/src/app/analytics/customer-spend-table.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerAnalyticsPanelComponent

COMPONENT_NAME: CustomerSummaryPanelComponent
TYPE: Utility
PURPOSE: Customer count and total tiles.
RESPONSIBILITIES:
  - Render the summary counts and totals, flagging operator-filtered results.
SOURCE: `projects/admin/src/app/analytics/customer-summary-panel.component.ts`
CALLS:
  - CustomerCountTileComponent — tile rendering.
CALLED_BY:
  - CustomerAnalyticsPanelComponent

COMPONENT_NAME: CustomerSummaryChartComponent
TYPE: Utility
PURPOSE: ECharts chart of customer summary buckets.
RESPONSIBILITIES:
  - Build the chart option from buckets, granularity and metric.
SOURCE: `projects/admin/src/app/analytics/customer-summary-chart.component.ts`
CALLS:
  - echarts-setup — registered ECharts modules through `provideEchartsCore`.
CALLED_BY:
  - CustomerAnalyticsPanelComponent

COMPONENT_NAME: CustomerCountTileComponent
TYPE: Utility
PURPOSE: Single labelled customer-count tile.
RESPONSIBILITIES:
  - Render label, hint and value.
SOURCE: `projects/admin/src/app/analytics/customer-count-tile.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerSummaryPanelComponent

COMPONENT_NAME: EquipmentTypeSelectComponent
TYPE: Utility
PURPOSE: Equipment-type scope selector for analytics filters.
RESPONSIBILITIES:
  - Load types on demand and emit the selected slug.
SOURCE: `projects/admin/src/app/analytics/equipment-type-select.component.ts`
CALLS:
  - EquipmentTypeStore — `types()`, `load()`.
CALLED_BY:
  - AnalyticsPageComponent

COMPONENT_NAME: EquipmentUnitSelectComponent
TYPE: Utility
PURPOSE: Equipment-unit scope selector bound to a type slug.
RESPONSIBILITIES:
  - Load units for the selected type and emit the selected unit id.
SOURCE: `projects/admin/src/app/analytics/equipment-unit-select.component.ts`
CALLS:
  - EquipmentUnitOptionsStore — `setTypeSlug()`, items.
CALLED_BY:
  - AnalyticsPageComponent

COMPONENT_NAME: OperatorSelectComponent
TYPE: Utility
PURPOSE: Operator scope selector for analytics filters.
RESPONSIBILITIES:
  - Load users on demand and emit the selected operator id.
SOURCE: `projects/admin/src/app/analytics/operator-select.component.ts`
CALLS:
  - ManagedUserStore — `users()`, `load()`.
CALLED_BY:
  - AnalyticsPageComponent

COMPONENT_NAME: echarts-setup
TYPE: Utility
PURPOSE: Side-effect module registering the ECharts components the admin charts use.
RESPONSIBILITIES:
  - Register bar/line charts, grid, tooltip, legend, data zoom and the canvas renderer.
  - Re-export the configured `echarts` instance.
SOURCE: `projects/admin/src/app/analytics/echarts-setup.ts`
CALLS:
  - NONE
CALLED_BY:
  - RevenueChartComponent
  - CustomerSummaryChartComponent

### Operator feature components

COMPONENT_NAME: RentalDashboardComponent
TYPE: Gateway
PURPOSE: Operator landing screen hosting the active and history rental tabs.
RESPONSIBILITIES:
  - Mirror the selected tab into a query parameter.
  - Provide the shared `RentalListStore` and delegate refresh to the active tab.
SOURCE: `projects/operator/src/app/dashboard/rental-dashboard.component.ts`
CALLS:
  - RentalActiveTabComponent — active rentals tab.
  - RentalHistoryTabComponent — history tab.
  - SegmentedTabsComponent — tab bar.
  - Router — tab query parameter.
CALLED_BY:
  - OperatorRoutes

COMPONENT_NAME: RentalActiveTabComponent
TYPE: Gateway
PURPOSE: Active-rentals tab implementing the refreshable-tab contract.
RESPONSIBILITIES:
  - Load active rentals and expose `refresh()` / `isLoading` to the parent.
SOURCE: `projects/operator/src/app/dashboard/rental-active-tab.component.ts`
CALLS:
  - RentalListStore — `loadActive()`, `activeRentals()`, `isLoadingActive()`.
  - RentalActiveCardListComponent — card list.
CALLED_BY:
  - RentalDashboardComponent

COMPONENT_NAME: RentalHistoryTabComponent
TYPE: Gateway
PURPOSE: History tab with draft/debt/date filters.
RESPONSIBILITIES:
  - Load history by filter or date range and mirror the filter into the URL.
SOURCE: `projects/operator/src/app/dashboard/rental-history-tab.component.ts`
CALLS:
  - RentalListStore — `loadByFilter()`, `loadHistory()`, `reloadHistory()`, history signals.
  - RentalHistoryCardListComponent — card list.
  - Router — filter query parameter.
CALLED_BY:
  - RentalDashboardComponent

COMPONENT_NAME: RentalActiveCardListComponent
TYPE: Utility
PURPOSE: Presentational list of active rental cards.
RESPONSIBILITIES:
  - Render one card per item with a loading state.
SOURCE: `projects/operator/src/app/dashboard/rental-active-card-list.component.ts`
CALLS:
  - RentalCardComponent — card rendering.
CALLED_BY:
  - RentalActiveTabComponent

COMPONENT_NAME: RentalHistoryCardListComponent
TYPE: Gateway
PURPOSE: History card list with the debt write-off action.
RESPONSIBILITIES:
  - Render history cards and confirm debt write-off.
  - Report the outcome and reload the list.
SOURCE: `projects/operator/src/app/dashboard/rental-history-card-list.component.ts`
CALLS:
  - RentalListStore — `writeOffDebt()`, `reloadHistory()`, history signals.
  - ConfirmDialogComponent — destructive confirmation.
  - NotificationService / ApiErrorParser / ErrorMessageResolver — outcome reporting.
  - RentalCardComponent — card rendering.
CALLED_BY:
  - RentalHistoryTabComponent

COMPONENT_NAME: RentalCardComponent
TYPE: Utility
PURPOSE: Single rental card that routes by rental status.
RESPONSIBILITIES:
  - Render the rental summary and status badge.
  - Navigate to edit, agreement or detail depending on status; emit `writeOffRequested`.
SOURCE: `projects/operator/src/app/dashboard/rental-card.component.ts`
CALLS:
  - Router — status-dependent navigation.
CALLED_BY:
  - RentalActiveCardListComponent
  - RentalHistoryCardListComponent

COMPONENT_NAME: RentalCreateComponent
TYPE: Gateway
PURPOSE: Rental creation wizard and DI root for the whole create flow.
RESPONSIBILITIES:
  - Provide the rental store graph shared by every step and child.
  - Switch between step 1 and step 2 and skip step 1 when editing an existing draft.
  - Redirect to signing or detail when the loaded rental is no longer a draft.
SOURCE: `projects/operator/src/app/rental-create/rental-create.component.ts`
CALLS:
  - RentalStore — `loadDetail()`, status and version signals.
  - RentalStep1Component — customer selection step.
  - RentalStep2Component — composition step.
  - Router — redirect by rental status.
CALLED_BY:
  - OperatorRoutes

COMPONENT_NAME: RentalStep1Component
TYPE: Utility
PURPOSE: Step 1 — pick or create the customer.
RESPONSIBILITIES:
  - Seed the search box from the current customer and write the selection into the store.
  - Emit `customerSelected` to advance the wizard.
SOURCE: `projects/operator/src/app/rental-create/step1/rental-step1.component.ts`
CALLS:
  - RentalStore — `customer()`, `setCustomer()`.
  - CustomerSearchInputComponent — search and inline create.
CALLED_BY:
  - RentalCreateComponent

COMPONENT_NAME: CustomerSearchInputComponent
TYPE: Utility
PURPOSE: Phone-number customer autocomplete with an inline create affordance.
RESPONSIBILITIES:
  - Search customers through its own scoped list store.
  - Reveal the inline create form for an unknown number and emit the chosen customer.
SOURCE: `projects/operator/src/app/rental-create/step1/customer-search-input.component.ts`
CALLS:
  - CustomerListStore — `search()`, `customers()`.
  - CustomerSearchOptionComponent — option rendering.
  - CustomerCreateInlineFormComponent — inline creation.
CALLED_BY:
  - RentalStep1Component

COMPONENT_NAME: CustomerSearchOptionComponent
TYPE: Utility
PURPOSE: Single autocomplete option for a customer.
RESPONSIBILITIES:
  - Render the customer identity line.
SOURCE: `projects/operator/src/app/rental-create/step1/customer-search-option.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerSearchInputComponent

COMPONENT_NAME: CustomerCreateInlineFormComponent
TYPE: Utility
PURPOSE: Inline customer creation form seeded with the searched phone number.
RESPONSIBILITIES:
  - Build and validate the customer form through the shared form provider.
  - Create the customer and emit it upward.
SOURCE: `projects/operator/src/app/rental-create/step1/customer-create-inline-form.component.ts`
CALLS:
  - CustomerStore — `create()`, `saving()`.
  - CustomerFormProvider — form construction and write extraction.
  - MatSnackBar — failure message.
CALLED_BY:
  - CustomerSearchInputComponent

COMPONENT_NAME: RentalStep2Component
TYPE: Gateway
PURPOSE: Step 2 — compose equipment, duration and price, then send the rental to signing.
RESPONSIBILITIES:
  - Add and remove equipment items; auto-save the draft on the first item and rewrite the URL to the edit route.
  - Open top-up and withdraw dialogs when the balance is short.
  - Proceed to signing, save the draft or cancel the rental.
SOURCE: `projects/operator/src/app/rental-create/step2/rental-step2.component.ts`
CALLS:
  - RentalStore — equipment mutation, `save()`, `proceedToSigning()`, `cancelRental()`, `reset()`.
  - RentalValidationStore — balance shortfall.
  - CustomerFinanceStore — balance.
  - RentalDetailRefreshFacade — `refreshFinancials()`.
  - TopUpDialogComponent / WithdrawDialogComponent — money movements.
  - CancelRentalDialogComponent — cancellation confirmation.
  - RentalCustomerPanelComponent, RentalEquipmentSectionComponent (create flow), RentalReservedPanelComponent, RentalDurationControlComponent, RentalCostFooterComponent — sections.
  - NotificationService — outcome reporting.
  - Router / Location — navigate to signing and rewrite the draft URL.
CALLED_BY:
  - RentalCreateComponent

COMPONENT_NAME: RentalCustomerPanelComponent
TYPE: Utility
PURPOSE: Collapsible customer panel shared by the create, detail and return screens.
RESPONSIBILITIES:
  - Render the customer identity, rating and balance sufficiency.
  - Emit top-up, withdraw and open-profile intents.
SOURCE: `projects/operator/src/app/rental-create/step2/rental-customer-panel.component.ts`
CALLS:
  - CustomerRatingService — `getRating()`.
  - CustomerPanelHeaderComponent — header rendering.
CALLED_BY:
  - RentalDetailComponent
  - RentalStep2Component
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: RentalEquipmentSectionComponent (create flow)
TYPE: Utility
PURPOSE: Equipment search, QR scan and selection list for rental composition.
RESPONSIBILITIES:
  - Search available equipment through its own scoped search store.
  - Resolve scanned UIDs to equipment items.
  - Emit `itemAdded` and `itemRemoved`.
SOURCE: `projects/operator/src/app/rental-create/step2/rental-equipment-section.component.ts`
CALLS:
  - EquipmentSearchStore — `search()`, results.
  - EquipmentScanResolverService — `resolve(uid)`.
  - RentalStore — duration for price display.
  - RentalCostCalculationStore — per-unit breakdowns.
  - EquipmentUnitViewModelMapper — card view models.
  - QrScanDialogComponent — camera scan.
  - EquipmentSearchOptionComponent / EquipmentUnitCardComponent — presentation.
CALLED_BY:
  - RentalStep2Component
  - AddEquipmentDialogComponent

COMPONENT_NAME: RentalReservedPanelComponent
TYPE: Utility
PURPOSE: Collapsible panel showing the funds reserved for the rental.
RESPONSIBILITIES:
  - Render the reserved amount, transaction list and error state.
SOURCE: `projects/operator/src/app/rental-create/step2/rental-reserved-panel.component.ts`
CALLS:
  - RentalTransactionsStore — `transactions()`, `reserved()`, `reload()`.
  - RentalReservedPanelHeaderComponent — header rendering.
  - TransactionListItemComponent — row rendering.
CALLED_BY:
  - RentalDetailComponent
  - RentalStep2Component

COMPONENT_NAME: RentalReservedPanelHeaderComponent
TYPE: Utility
PURPOSE: Header row of the reserved-funds panel.
RESPONSIBILITIES:
  - Render the count and reserved amount; emit `toggled`.
SOURCE: `projects/operator/src/app/rental-create/step2/rental-reserved-panel-header.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalReservedPanelComponent

COMPONENT_NAME: RentalCostFooterComponent
TYPE: Utility
PURPOSE: Sticky footer with the live estimate, price mode controls and the primary actions.
RESPONSIBILITIES:
  - Render the estimate, projected balance and proceed eligibility.
  - Write price mode, discount and fixed price into the rental store.
  - Emit next, save-draft, top-up and cancel intents.
SOURCE: `projects/operator/src/app/rental-create/step2/rental-cost-footer.component.ts`
CALLS:
  - RentalStore — price mode and price setters, saving flag.
  - RentalCostCalculationStore — `estimate()`, `isCalculating()`.
  - RentalValidationStore — `canProceed()`, `projectedBalance()`, balance sufficiency.
  - RentalPriceControlComponent — price mode UI.
  - RentalBalanceWarningComponent — shortfall warning.
CALLED_BY:
  - RentalStep2Component

COMPONENT_NAME: EquipmentSearchOptionComponent
TYPE: Utility
PURPOSE: Single autocomplete option for an equipment unit.
RESPONSIBILITIES:
  - Render the unit identity with query highlighting.
SOURCE: `projects/operator/src/app/rental-create/step2/equipment-search-option.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalEquipmentSectionComponent

COMPONENT_NAME: RentalDurationControlComponent
TYPE: Utility
PURPOSE: Duration control adapting the snap-point slider to the rental store.
RESPONSIBILITIES:
  - Read the duration from the store and write back the snapped value.
SOURCE: `projects/operator/src/app/rental-create/step2/duration/rental-duration-control.component.ts`
CALLS:
  - RentalStore — `durationMinutes()`, `setDurationMinutes()`.
  - DurationSliderComponent — slider UI.
CALLED_BY:
  - RentalStep2Component

COMPONENT_NAME: DurationSliderComponent
TYPE: Utility
PURPOSE: Snap-point duration slider.
RESPONSIBILITIES:
  - Render the slider over the snap points and emit `valueChange`.
SOURCE: `projects/operator/src/app/rental-create/step2/duration/duration-slider.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalDurationControlComponent

COMPONENT_NAME: DurationInputComponent
TYPE: Utility
PURPOSE: Numeric duration input. Currently unreferenced anywhere in the workspace.
RESPONSIBILITIES:
  - Render a bounded numeric duration input and emit `valueChange`.
SOURCE: `projects/operator/src/app/rental-create/step2/duration/duration-input.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - NONE

COMPONENT_NAME: RentalBalanceWarningComponent
TYPE: Utility
PURPOSE: Balance-shortfall warning with a top-up call to action.
RESPONSIBILITIES:
  - Render the shortfall and emit `topUpRequested`.
SOURCE: `projects/operator/src/app/rental-create/step3/rental-balance-warning.component.ts`
CALLS:
  - RentalValidationStore — `isBalanceSufficient()`, `balanceShortfall()`.
CALLED_BY:
  - RentalCostFooterComponent

COMPONENT_NAME: RentalPriceControlComponent
TYPE: Utility
PURPOSE: Price-mode control switching between full, discount and fixed pricing.
RESPONSIBILITIES:
  - Render the mode selector with its sub-inputs and emit the pricing draft.
SOURCE: `projects/operator/src/app/pricing/rental-price-control.component.ts`
CALLS:
  - DiscountPercentInputComponent — discount entry.
  - FixedPriceInputComponent — fixed price entry.
CALLED_BY:
  - ChangePriceSheetComponent
  - RentalCostFooterComponent
  - RentalPricingStore

COMPONENT_NAME: FixedPriceInputComponent
TYPE: Utility
PURPOSE: Fixed-price numeric entry.
RESPONSIBILITIES:
  - Render the amount input with currency and emit `valueChange`.
SOURCE: `projects/operator/src/app/pricing/fixed-price-input.component.ts`
CALLS:
  - InlineNumberInputComponent — numeric input primitive.
CALLED_BY:
  - RentalPriceControlComponent

COMPONENT_NAME: DiscountPercentInputComponent
TYPE: Utility
PURPOSE: Discount-percentage entry.
RESPONSIBILITIES:
  - Render the percentage input and emit `valueChange`.
SOURCE: `projects/operator/src/app/pricing/discount-percent-input.component.ts`
CALLS:
  - InlineNumberInputComponent — numeric input primitive.
CALLED_BY:
  - RentalPriceControlComponent

COMPONENT_NAME: InlineNumberInputComponent
TYPE: Utility
PURPOSE: Bounded inline numeric input primitive.
RESPONSIBILITIES:
  - Clamp, format and emit the numeric value with an optional suffix.
SOURCE: `projects/operator/src/app/pricing/inline-number-input.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - DiscountPercentInputComponent
  - FixedPriceInputComponent

COMPONENT_NAME: RentalDetailComponent
TYPE: Gateway
PURPOSE: Operator rental detail screen and DI root for the detail flow.
RESPONSIBILITIES:
  - Load the rental, its transactions, damage reports and signature summary.
  - Redirect drafts to the wizard and awaiting-signature rentals to the agreement screen.
  - Toggle the inline return screen and open money dialogs.
  - Preselect an equipment item from the `selectUid` query parameter.
SOURCE: `projects/operator/src/app/rental-detail/rental-detail.component.ts`
CALLS:
  - RentalStore — `loadDetail()`, lifecycle signals, selection methods.
  - DamageReportStore — `search()`, pending-penalty flags.
  - RentalSignatureStore — `load()`.
  - RentalDetailRefreshFacade — `refreshAll()`, `refreshFinancials()`.
  - CustomerFinanceStore — balance.
  - RentalTransactionsStore — reserved amount.
  - TopUpDialogComponent / WithdrawDialogComponent — money movements.
  - RentalCustomerPanelComponent, RentalReservedPanelComponent, RentalEquipmentSectionComponent (detail flow), RentalCostSectionComponent, RentalActionButtonsComponent, ReturnEquipmentScreenComponent, RentalPeriodSectionComponent, RentalAgreementDownloadComponent — sections.
  - Router — status redirects and penalty deep links.
CALLED_BY:
  - OperatorRoutes

COMPONENT_NAME: RentalActionButtonsComponent
TYPE: Utility
PURPOSE: Primary lifecycle actions on an active or debt rental.
RESPONSIBILITIES:
  - Start the return flow, cancel the rental and open the damage-report sheet.
SOURCE: `projects/operator/src/app/rental-detail/rental-action-buttons.component.ts`
CALLS:
  - RentalStore — lifecycle signals, `cancelRental()`.
  - RentalDetailRefreshFacade — `refreshAll()`.
  - CancelRentalDialogComponent — cancellation confirmation.
  - ReportDamageSheetComponent — damage reporting.
  - NotificationService / ErrorMessageResolver — outcome reporting.
CALLED_BY:
  - RentalDetailComponent

COMPONENT_NAME: RentalCostSectionComponent
TYPE: Utility
PURPOSE: Cost summary of an active rental with the change-price entry point.
RESPONSIBILITIES:
  - Render total cost, reserved amount, discount and written-off amount.
  - Open the change-price sheet and refresh afterwards.
SOURCE: `projects/operator/src/app/rental-detail/rental-cost-section.component.ts`
CALLS:
  - RentalCostCalculationStore — `totalCost()`, `isCalculating()`, `isFinal()`.
  - RentalStore — price mode, discount, written-off amount.
  - RentalTransactionsStore — reserved amount.
  - RentalDetailRefreshFacade — `refreshAll()`, `refreshFinancials()`.
  - ChangePriceSheetComponent — pricing change.
  - NotificationService — outcome reporting.
CALLED_BY:
  - RentalDetailComponent

COMPONENT_NAME: RentalEquipmentSectionComponent (detail flow)
TYPE: Utility
PURPOSE: Equipment list of an existing rental with return selection and the add-equipment entry point.
RESPONSIBILITIES:
  - Render active and returned units with per-unit cost breakdowns.
  - Drive the return selection (single, all, clear).
  - Open the add-equipment dialog.
SOURCE: `projects/operator/src/app/rental-detail/rental-equipment-section.component.ts`
CALLS:
  - RentalStore — selection methods and rental timing signals.
  - RentalCostCalculationStore — `breakdowns()`.
  - RentalDetailRefreshFacade — `refreshFinancials()`.
  - TimeStore — current time for elapsed display.
  - AddEquipmentDialogComponent — add equipment to an active rental.
  - EquipmentUnitCardComponent — unit rendering.
CALLED_BY:
  - RentalDetailComponent

COMPONENT_NAME: CancelRentalDialogComponent
TYPE: Utility
PURPOSE: Confirmation dialog for cancelling a rental.
RESPONSIBILITIES:
  - Close with `true` on confirmation.
SOURCE: `projects/operator/src/app/rental-detail/cancel-rental-dialog.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalActionButtonsComponent
  - RentalAgreementComponent
  - RentalStep2Component

COMPONENT_NAME: ChangePriceSheetComponent
TYPE: Utility
PURPOSE: Bottom sheet for changing the price of an active rental.
RESPONSIBILITIES:
  - Quote the new price live and submit the change.
  - Refresh the rental when the backend reports a stale status or missing rental.
SOURCE: `projects/operator/src/app/rental-detail/change-price-sheet.component.ts`
CALLS:
  - RentalPricingStore — `setDraft()`, `estimate()`, `submit()`.
  - RentalDetailRefreshFacade — `refreshAll()` on stale state.
  - RentalPriceControlComponent — price mode UI.
  - NotificationService / ErrorMessageResolver / resolveGeneralErrors — outcome reporting.
CALLED_BY:
  - RentalCostSectionComponent

COMPONENT_NAME: ReportDamageSheetComponent
TYPE: Utility
PURPOSE: Bottom sheet for registering a damage report against selected equipment.
RESPONSIBILITIES:
  - Select up to five equipment items and capture condition, description and penalty.
  - Submit with an idempotency key and bind server validation errors.
SOURCE: `projects/operator/src/app/rental-detail/report-damage-sheet.component.ts`
CALLS:
  - DamageReportCreateStore — `register()`, `saving`.
  - applyServerErrors / clearServerErrors — bind backend validation errors.
  - NotificationService / ErrorMessageResolver — outcome reporting.
CALLED_BY:
  - RentalActionButtonsComponent

COMPONENT_NAME: AddEquipmentDialogComponent
TYPE: Utility
PURPOSE: Dialog for adding equipment to an already active rental.
RESPONSIBILITIES:
  - Select available equipment and submit the addition.
  - Drop units the backend reports unavailable and refresh on a stale status.
SOURCE: `projects/operator/src/app/rental-detail/add-equipment-dialog/add-equipment-dialog.component.ts`
CALLS:
  - RentalStore — `addEquipmentToRental()`, expected return time.
  - RentalDetailRefreshFacade — `refreshAll()` on stale state.
  - RentalEquipmentSectionComponent (create flow) — equipment search and selection.
  - NotificationService / ErrorMessageResolver — outcome reporting.
CALLED_BY:
  - RentalEquipmentSectionComponent

COMPONENT_NAME: ReturnEquipmentScreenComponent
TYPE: Gateway
PURPOSE: Inline return screen settling the selected equipment against a server-side quote.
RESPONSIBILITIES:
  - Estimate live, then create a quote and display the settlement (refund or charge).
  - Confirm the return against the quote and handle expired, missing, mismatched and consumed quotes.
  - Open top-up and withdraw dialogs when settlement requires money movement.
SOURCE: `projects/operator/src/app/rental-detail/return-equipment-screen/return-equipment-screen.component.ts`
CALLS:
  - ReturnEquipmentCostStore — `enterQuoteMode()`, `createQuote()`, `deleteQuote()`, settlement signals.
  - RentalStore — `returnEquipment()`, `confirmReturn()`, selection signals.
  - RentalDetailRefreshFacade — `refreshAll()` on stale state.
  - CustomerFinanceStore — balance.
  - TimeStore — current time.
  - TopUpDialogComponent / WithdrawDialogComponent — money movements.
  - ReturnSettlementSummaryComponent — settlement rendering.
  - RentalCustomerPanelComponent — customer panel.
  - NotificationService / ErrorMessageResolver — outcome reporting.
CALLED_BY:
  - RentalDetailComponent

COMPONENT_NAME: ReturnSettlementSummaryComponent
TYPE: Utility
PURPOSE: Held-amount versus final-cost settlement summary.
RESPONSIBILITIES:
  - Render held amount, cost and the resulting refund or charge.
SOURCE: `projects/operator/src/app/rental-detail/return-equipment-screen/return-settlement-summary.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: ReturnComponent
TYPE: Gateway
PURPOSE: QR entry point that finds the active rental holding a scanned unit.
RESPONSIBILITIES:
  - Auto-open the scan dialog on entry.
  - Look the UID up and navigate to the rental with the unit preselected.
SOURCE: `projects/operator/src/app/return/return.component.ts`
CALLS:
  - RentalLookupStore — `lookup()`, `foundRentalId()`, `notFound()`.
  - QrScanDialogComponent — camera scan.
  - Router — navigate to the rental detail with `selectUid`.
CALLED_BY:
  - OperatorRoutes

COMPONENT_NAME: RentalAgreementComponent
TYPE: Gateway
PURPOSE: Agreement review and signature capture, the de-facto final step of rental creation.
RESPONSIBILITIES:
  - Load the rental and its rendered agreement.
  - Capture the signature and submit it with the rental version.
  - Cancel signing or the rental, and clear the pad on an invalid-signature error.
SOURCE: `projects/operator/src/app/rental-agreement/rental-agreement.component.ts`
CALLS:
  - RentalStore — `loadDetail()`, `cancelSigning()`, `cancelRental()`, pricing and version signals.
  - AgreementSigningStore — `loadRentalAgreement()`, `sign()`.
  - SignaturePadComponent — signature capture.
  - CancelRentalDialogComponent — cancellation confirmation.
  - NotificationService — outcome reporting.
  - Router / Location — post-signing navigation.
CALLED_BY:
  - OperatorRoutes

### Shared UI — layout and page primitives

COMPONENT_NAME: ShellComponent
TYPE: Utility
PURPOSE: Generic application shell with sidenav, toolbar and content projection.
RESPONSIBILITIES:
  - Compose sidebar, toolbar and the projected content; emit `toggleSidebar` and `logout`.
SOURCE: `projects/shared/src/shared/components/shell/shell.component.ts`
CALLS:
  - SidebarComponent — navigation rail.
  - AppToolbarComponent — top bar.
CALLED_BY:
  - AdminLayoutComponent

COMPONENT_NAME: SidebarComponent
TYPE: Utility
PURPOSE: Sidenav navigation list.
RESPONSIBILITIES:
  - Render the brand and one nav item per `NavItem`.
SOURCE: `projects/shared/src/shared/components/sidebar/sidebar.component.ts`
CALLS:
  - AppBrandComponent — brand block.
  - SidebarNavItemComponent — nav rows.
CALLED_BY:
  - ShellComponent

COMPONENT_NAME: SidebarNavItemComponent
TYPE: Utility
PURPOSE: Single sidenav row bound to a router link.
RESPONSIBILITIES:
  - Render icon, label and active state.
SOURCE: `projects/shared/src/shared/components/sidebar-nav-item/sidebar-nav-item.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - SidebarComponent

COMPONENT_NAME: AppToolbarComponent
TYPE: Utility
PURPOSE: Top toolbar with title, sidebar toggle, time-travel display and logout.
RESPONSIBILITIES:
  - Render the title and optional controls; emit `toggleSidebar` and `logout`.
  - Show the time-travel display only when time travel is enabled.
SOURCE: `projects/shared/src/shared/components/app-toolbar/app-toolbar.component.ts`
CALLS:
  - TimeTravelStore — enablement flag.
  - TimeTravelDisplayComponent — simulated clock.
  - ToggleButtonComponent / LogoutButtonComponent — controls.
CALLED_BY:
  - OperatorLayoutComponent
  - ShellComponent

COMPONENT_NAME: AppBrandComponent
TYPE: Utility
PURPOSE: Application brand block that routes home when activated.
RESPONSIBILITIES:
  - Render the injected brand name and navigate to the app root.
SOURCE: `projects/shared/src/shared/components/app-brand/app-brand.component.ts`
CALLS:
  - Router — navigate home.
CALLED_BY:
  - SidebarComponent

COMPONENT_NAME: BottomNavComponent
TYPE: Utility
PURPOSE: Mobile bottom tab bar.
RESPONSIBILITIES:
  - Render one tab per `NavItem`.
SOURCE: `projects/shared/src/shared/components/bottom-nav/bottom-nav.component.ts`
CALLS:
  - BottomNavItemComponent — tab rendering.
CALLED_BY:
  - OperatorLayoutComponent

COMPONENT_NAME: BottomNavItemComponent
TYPE: Utility
PURPOSE: Single bottom-nav tab bound to a router link.
RESPONSIBILITIES:
  - Render icon, label and active state.
SOURCE: `projects/shared/src/shared/components/bottom-nav-item/bottom-nav-item.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - BottomNavComponent

COMPONENT_NAME: PageHeaderComponent
TYPE: Utility
PURPOSE: The single screen header — back button, title, actions slot and identity slot.
RESPONSIBILITIES:
  - Render the title and projected content without wrapping; emit `back`.
SOURCE: `projects/shared/src/shared/components/page-header/page-header.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerDetailComponent
  - DamageReportDetailComponent
  - RentalAgreementComponent
  - RentalDashboardComponent
  - RentalDetailComponent
  - RentalDetailPageComponent
  - ReturnEquipmentScreenComponent
  - TransactionDetailsPageComponent

COMPONENT_NAME: SegmentedTabsComponent
TYPE: Utility
PURPOSE: Equal-width tab bar supporting router-link and state-driven modes.
RESPONSIBILITIES:
  - Render tabs from `SegmentTab[]`; emit `tabSelect` in state mode.
SOURCE: `projects/shared/src/shared/components/segmented-tabs/segmented-tabs.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - AnalyticsPageComponent
  - CustomerDetailComponent
  - ProfileSettingsComponent
  - RentalDashboardComponent
  - RentalHistoryTabComponent
  - RentalPriceControlComponent

COMPONENT_NAME: CardStackComponent
TYPE: Utility
PURPOSE: Vertical card container with panel and inset variants.
RESPONSIBILITIES:
  - Provide consistent card spacing for projected content.
SOURCE: `projects/shared/src/shared/components/card-stack/card-stack.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalDetailComponent
  - RentalDetailPanelComponent
  - RentalEquipmentSectionComponent
  - RentalStep2Component
  - RentalTransactionsSectionComponent
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: CollapsibleSectionComponent
TYPE: Utility
PURPOSE: Expandable section with loading and empty states.
RESPONSIBILITIES:
  - Toggle the projected body and emit `expandedChange`.
SOURCE: `projects/shared/src/shared/components/collapsible-section/collapsible-section.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalDamageReportsSectionComponent
  - RentalTransactionsSectionComponent

### Shared UI — buttons and atoms

COMPONENT_NAME: ButtonComponent
TYPE: Utility
PURPOSE: Text or icon button primitive.
RESPONSIBILITIES:
  - Render the label/icon and emit `activated`.
SOURCE: `projects/shared/src/shared/components/button/button.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - LogoutButtonComponent
  - ToggleButtonComponent

COMPONENT_NAME: CancelButtonComponent
TYPE: Utility
PURPOSE: Form cancel button that closes an ambient dialog when present.
RESPONSIBILITIES:
  - Close the optional `MatDialogRef` and emit `cancelled`.
SOURCE: `projects/shared/src/shared/components/cancel-button/cancel-button.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - AgreementDialogComponent
  - CustomerCreateDialogComponent
  - CustomerEditComponent
  - EquipmentDialogComponent
  - EquipmentTypeDialogComponent
  - QrScanDialogComponent
  - TariffDialogComponent
  - TimeTravelDialogComponent
  - TopUpDialogComponent
  - UserCreateDialogComponent
  - UserEditDialogComponent
  - WithdrawDialogComponent

COMPONENT_NAME: SaveButtonComponent
TYPE: Utility
PURPOSE: Form save button with a busy state.
RESPONSIBILITIES:
  - Render the saving spinner and emit `save`.
SOURCE: `projects/shared/src/shared/components/save-button/save-button.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerEditComponent
  - EquipmentDialogComponent
  - EquipmentTypeDialogComponent
  - TariffDialogComponent

COMPONENT_NAME: ToggleButtonComponent
TYPE: Utility
PURPOSE: Pressed-state toggle button used for the sidebar menu.
RESPONSIBILITIES:
  - Render the pressed state and emit `toggled`.
SOURCE: `projects/shared/src/shared/components/toggle-button/toggle-button.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - AppToolbarComponent

COMPONENT_NAME: LogoutButtonComponent
TYPE: Utility
PURPOSE: Logout affordance.
RESPONSIBILITIES:
  - Emit `logout`.
SOURCE: `projects/shared/src/shared/components/logout-button/logout-button.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - NONE

COMPONENT_NAME: TopUpButtonComponent
TYPE: Utility
PURPOSE: Balance top-up affordance.
RESPONSIBILITIES:
  - Emit `confirm`.
SOURCE: `projects/shared/src/shared/components/top-up-button/top-up-button.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerAccountComponent
  - RentalBalanceWarningComponent
  - RentalCustomerPanelComponent

COMPONENT_NAME: WithdrawButtonComponent
TYPE: Utility
PURPOSE: Balance withdrawal affordance.
RESPONSIBILITIES:
  - Emit `confirm`.
SOURCE: `projects/shared/src/shared/components/withdraw-button/withdraw-button.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerAccountComponent
  - RentalCustomerPanelComponent

COMPONENT_NAME: DashboardCardComponent
TYPE: Utility
PURPOSE: Large navigation card.
RESPONSIBILITIES:
  - Render title and description; emit `activate`.
SOURCE: `projects/shared/src/shared/components/dashboard-card/dashboard-card.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - HomeComponent

COMPONENT_NAME: UserAvatarComponent
TYPE: Utility
PURPOSE: Avatar showing a photo or derived initials.
RESPONSIBILITIES:
  - Render the photo when present, otherwise the initials.
SOURCE: `projects/shared/src/shared/components/user-avatar/user-avatar.component.ts`
CALLS:
  - userInitials — derive initials from the display name.
CALLED_BY:
  - CustomerDetailComponent
  - CustomerPanelHeaderComponent
  - ProfileAccountComponent
  - ProfileMenuComponent

### Shared UI — badges and display

COMPONENT_NAME: RentalStatusBadgeComponent
TYPE: Utility
PURPOSE: Localized rental status badge.
RESPONSIBILITIES:
  - Map the status to label and colour via `rental-status.meta`.
SOURCE: `projects/shared/src/shared/components/rental-status-badge/rental-status-badge.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalDetailPanelComponent
  - RentalTableComponent

COMPONENT_NAME: RentalPriceModeBadgeComponent
TYPE: Utility
PURPOSE: Price-mode badge, optionally interactive.
RESPONSIBILITIES:
  - Render the mode and discount; emit `pressed` when interactive.
SOURCE: `projects/shared/src/shared/components/rental-price-mode-badge/rental-price-mode-badge.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalCostSectionComponent
  - RentalDetailSummaryComponent

COMPONENT_NAME: EquipmentBadgeComponent
TYPE: Utility
PURPOSE: Compact equipment identity badge.
RESPONSIBILITIES:
  - Render the UID and name.
SOURCE: `projects/shared/src/shared/components/equipment-badge/equipment-badge.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerRentalListItemComponent
  - RentalCardComponent
  - RentalEquipmentCellComponent

COMPONENT_NAME: EquipmentStatusBadgeComponent
TYPE: Utility
PURPOSE: Equipment status badge.
RESPONSIBILITIES:
  - Map the status slug to a localized label and colour.
SOURCE: `projects/shared/src/shared/components/equipment-status-badge/equipment-status-badge.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - NONE

COMPONENT_NAME: PenaltyStatusBadgeComponent
TYPE: Utility
PURPOSE: Penalty status badge.
RESPONSIBILITIES:
  - Map the penalty status to a localized label and colour.
SOURCE: `projects/shared/src/shared/components/penalty-status-badge/penalty-status-badge.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - DamageReportDetailComponent
  - DamageReportHistoryComponent
  - DamageReportListItemComponent

COMPONENT_NAME: CostBreakdownComponent
TYPE: Utility
PURPOSE: Renders a tariff cost breakdown as localized lines.
RESPONSIBILITIES:
  - Resolve each breakdown entry to its localized formula text.
SOURCE: `projects/shared/src/shared/components/cost-breakdown/cost-breakdown.component.ts`
CALLS:
  - resolveBreakdownMessage — localized breakdown copy.
CALLED_BY:
  - EquipmentUnitDetailsComponent

COMPONENT_NAME: EquipmentTypeDropdownComponent
TYPE: Utility
PURPOSE: Equipment-type select implementing `ControlValueAccessor`.
RESPONSIBILITIES:
  - Bind the cached equipment types into a reactive form control.
SOURCE: `projects/shared/src/shared/components/equipment-type-dropdown/equipment-type-dropdown.component.ts`
CALLS:
  - EquipmentTypeStore — `types()`, `typesForEquipment()`.
CALLED_BY:
  - EquipmentDialogComponent
  - TariffDialogComponent

COMPONENT_NAME: EquipmentConditionFilterComponent
TYPE: Utility
PURPOSE: Multi-select equipment condition filter.
RESPONSIBILITIES:
  - Render the condition catalogue and emit `valueChange`.
SOURCE: `projects/shared/src/shared/components/equipment-condition-filter/equipment-condition-filter.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - EquipmentListComponent

COMPONENT_NAME: EquipmentUnitCardComponent
TYPE: Utility
PURPOSE: Equipment unit card with optional checkbox and remove control.
RESPONSIBILITIES:
  - Render the unit summary and details; emit `checkedChange` and `removed`.
SOURCE: `projects/shared/src/shared/components/equipment-unit/equipment-unit-card.component.ts`
CALLS:
  - EquipmentUnitSummaryComponent — identity row.
  - EquipmentUnitDetailsComponent — price and breakdown.
CALLED_BY:
  - RentalDetailPanelComponent
  - RentalEquipmentSectionComponent
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: EquipmentUnitSummaryComponent
TYPE: Utility
PURPOSE: Equipment unit identity row.
RESPONSIBILITIES:
  - Render UID, model and status.
SOURCE: `projects/shared/src/shared/components/equipment-unit/equipment-unit-summary.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - EquipmentUnitCardComponent

COMPONENT_NAME: EquipmentUnitDetailsComponent
TYPE: Utility
PURPOSE: Planned cost and breakdown block of an equipment card.
RESPONSIBILITIES:
  - Render the planned cost and its breakdown.
SOURCE: `projects/shared/src/shared/components/equipment-unit/equipment-unit-details.component.ts`
CALLS:
  - CostBreakdownComponent — breakdown lines.
CALLED_BY:
  - EquipmentUnitCardComponent

### Shared UI — customer

COMPONENT_NAME: CustomerDetailComponent
TYPE: Gateway
PURPOSE: Customer profile route host with tabbed child routes.
RESPONSIBILITIES:
  - Initialize the layout store from the route id.
  - Render the identity header, rating and the tab bar over the child outlet.
SOURCE: `projects/shared/src/shared/components/customer/profile-page/customer-detail.component.ts`
CALLS:
  - CustomerLayoutStore — `init()`, customer and balance.
  - CustomerRatingService — `getRating()`.
  - PageHeaderComponent / SegmentedTabsComponent — header and tabs.
  - Location — back navigation.
CALLED_BY:
  - CustomerProfileRoutes

COMPONENT_NAME: CustomerProfileComponent
TYPE: Gateway
PURPOSE: Profile tab — view and edit the customer's details.
RESPONSIBILITIES:
  - Toggle between view and edit and persist changes.
SOURCE: `projects/shared/src/shared/components/customer/profile-page/tabs/customer-profile/customer-profile.component.ts`
CALLS:
  - CustomerLayoutStore — the loaded customer.
  - CustomerStore — `update()`, `saving()`.
  - CustomerViewComponent / CustomerEditComponent — view and form.
  - MatSnackBar — failure message.
CALLED_BY:
  - CustomerProfileRoutes

COMPONENT_NAME: CustomerAccountComponent
TYPE: Gateway
PURPOSE: Account tab — balance with top-up and withdrawal actions.
RESPONSIBILITIES:
  - Render the balance and open the money dialogs.
  - Refresh the balance and invalidate the transaction list afterwards.
SOURCE: `projects/shared/src/shared/components/customer/profile-page/tabs/customer-account/customer-account.component.ts`
CALLS:
  - CustomerLayoutStore — the active customer id.
  - CustomerFinanceStore — `balance()`, `refreshBalance()`.
  - CustomerTransactionsStore — `invalidate()`.
  - TopUpDialogComponent / WithdrawDialogComponent — money movements.
  - MatSnackBar — outcome message.
CALLED_BY:
  - CustomerProfileRoutes

COMPONENT_NAME: CustomerTransactionsComponent
TYPE: Gateway
PURPOSE: Transactions tab — paged transaction history for the customer.
RESPONSIBILITIES:
  - Load the first page and page through the history.
SOURCE: `projects/shared/src/shared/components/customer/profile-page/tabs/customer-transactions/customer-transactions.component.ts`
CALLS:
  - CustomerTransactionsStore — `load()`, `loadPage()`, list signals.
  - TransactionListItemComponent — row rendering.
CALLED_BY:
  - CustomerProfileRoutes

COMPONENT_NAME: CustomerRentalsComponent
TYPE: Gateway
PURPOSE: Rentals tab — the customer's rental history with a date-range filter.
RESPONSIBILITIES:
  - Run the paged rental search scoped to the customer and mirror the range into the URL.
SOURCE: `projects/shared/src/shared/components/customer/profile-page/tabs/customer-rentals/customer-rentals.component.ts`
CALLS:
  - RentalSearchStore — `search()`, `reload()`, list and page signals.
  - CustomerLayoutStore — the active customer id.
  - RentalDateRangeFilterComponent — range filter.
  - CustomerRentalListItemComponent — row rendering.
  - Router — URL state.
CALLED_BY:
  - CustomerProfileRoutes

COMPONENT_NAME: CustomerPenaltiesComponent
TYPE: Gateway
PURPOSE: Penalties tab — damage reports and penalties raised against the customer.
RESPONSIBILITIES:
  - Run the paged damage-report search scoped to the customer, optionally filtered by rental.
SOURCE: `projects/shared/src/shared/components/customer/profile-page/tabs/customer-penalties/customer-penalties.component.ts`
CALLS:
  - DamageReportStore — `search()`, list and page signals.
  - CustomerLayoutStore — the active customer id.
  - PenaltyRentalFilterComponent — rental filter.
  - DamageReportListItemComponent — row rendering.
  - Router — URL state.
CALLED_BY:
  - CustomerProfileRoutes

COMPONENT_NAME: CustomerRentalListItemComponent
TYPE: Utility
PURPOSE: Rental row in the customer rentals tab, linking across apps.
RESPONSIBILITIES:
  - Render the rental summary and build a deployed link to the rental.
SOURCE: `projects/shared/src/shared/components/customer/profile-page/tabs/customer-rentals/customer-rental-list-item.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerRentalsComponent

COMPONENT_NAME: RentalDateRangeFilterComponent
TYPE: Utility
PURPOSE: Date-range filter for the customer rentals tab.
RESPONSIBILITIES:
  - Emit `rangeChange` and `clear`.
SOURCE: `projects/shared/src/shared/components/customer/profile-page/tabs/customer-rentals/rental-date-range-filter.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerRentalsComponent

COMPONENT_NAME: PenaltyRentalFilterComponent
TYPE: Utility
PURPOSE: Rental-id filter for the customer penalties tab.
RESPONSIBILITIES:
  - Emit `rentalIdChange`.
SOURCE: `projects/shared/src/shared/components/customer/profile-page/tabs/customer-penalties/penalty-rental-filter.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerPenaltiesComponent

COMPONENT_NAME: CustomerViewComponent
TYPE: Utility
PURPOSE: Read-only customer details block.
RESPONSIBILITIES:
  - Render the customer fields; emit `edit`.
SOURCE: `projects/shared/src/shared/components/customer/customer-view/customer-view.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerProfileComponent

COMPONENT_NAME: CustomerEditComponent
TYPE: Utility
PURPOSE: Customer edit form.
RESPONSIBILITIES:
  - Patch the shared form from the input customer and emit the write model on save.
SOURCE: `projects/shared/src/shared/components/customer/customer-edit/customer-edit.component.ts`
CALLS:
  - CustomerFormProvider — form construction and write extraction.
CALLED_BY:
  - CustomerProfileComponent

COMPONENT_NAME: CustomerFormProvider
TYPE: Utility
PURPOSE: Injectable factory owning the shared customer reactive form.
RESPONSIBILITIES:
  - Build the form with shared validators; patch values and extract `CustomerWrite`.
SOURCE: `projects/shared/src/shared/components/customer/customer-form.provider.ts`
CALLS:
  - PhoneValidators — phone rules.
CALLED_BY:
  - CustomerCreateDialogComponent
  - CustomerCreateInlineFormComponent
  - CustomerEditComponent

COMPONENT_NAME: CustomerCreateDialogComponent
TYPE: Utility
PURPOSE: Dialog for creating a customer.
RESPONSIBILITIES:
  - Validate and submit the form; close with the created customer.
SOURCE: `projects/shared/src/shared/components/customer/customer-create-dialog/customer-create-dialog.component.ts`
CALLS:
  - CustomerStore — `create()`, `saving()`.
  - CustomerFormProvider — form construction and write extraction.
  - MatSnackBar — failure message.
CALLED_BY:
  - CustomerListComponent

COMPONENT_NAME: CustomerPanelHeaderComponent
TYPE: Utility
PURPOSE: Collapsible customer header with balance, rating and money actions.
RESPONSIBILITIES:
  - Render the identity line and balance pill; emit `toggled`.
SOURCE: `projects/shared/src/shared/components/customer/customer-panel-header/customer-panel-header.component.ts`
CALLS:
  - CustomerBalancePillComponent — balance pill.
  - CustomerRatingBadgeComponent — rating badge.
CALLED_BY:
  - RentalCustomerPanelComponent

COMPONENT_NAME: CustomerBalancePillComponent
TYPE: Utility
PURPOSE: Balance pill coloured by sufficiency.
RESPONSIBILITIES:
  - Render the available balance and sufficiency state.
SOURCE: `projects/shared/src/shared/components/customer/customer-balance-pill/customer-balance-pill.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerPanelHeaderComponent

COMPONENT_NAME: CustomerRatingBadgeComponent
TYPE: Utility
PURPOSE: Customer rating badge.
RESPONSIBILITIES:
  - Render the rating value.
SOURCE: `projects/shared/src/shared/components/customer/customer-rating-badge/customer-rating-badge.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerDetailComponent
  - CustomerPanelHeaderComponent

COMPONENT_NAME: CustomerCommentsListComponent
TYPE: Utility
PURPOSE: List of operator comments on a customer.
RESPONSIBILITIES:
  - Render the comment entries.
SOURCE: `projects/shared/src/shared/components/customer/customer-comments-list/customer-comments-list.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalCustomerPanelComponent

COMPONENT_NAME: CustomerRefComponent
TYPE: Utility
PURPOSE: Inline customer reference, optionally linked to the profile.
RESPONSIBILITIES:
  - Render the customer name and phone with an optional router link.
SOURCE: `projects/shared/src/shared/components/customer/customer-ref/customer-ref.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalDetailSummaryComponent
  - RentalTableComponent

### Shared UI — rental, transactions, damage reports

COMPONENT_NAME: RentalPeriodSectionComponent
TYPE: Utility
PURPOSE: Rental period block reading the ambient rental store.
RESPONSIBILITIES:
  - Render start, expected and actual return times, overdue state and duration delta.
SOURCE: `projects/shared/src/shared/components/rental-period-section/rental-period-section.component.ts`
CALLS:
  - RentalStore — period and overdue signals.
CALLED_BY:
  - RentalDetailComponent
  - RentalDetailSummaryComponent

COMPONENT_NAME: RentalAgreementDownloadComponent
TYPE: Utility
PURPOSE: Download control for the signed agreement PDF.
RESPONSIBILITIES:
  - Show the signature summary and trigger the PDF download.
SOURCE: `projects/shared/src/shared/components/rental-agreement-download/rental-agreement-download.component.ts`
CALLS:
  - RentalSignatureStore — `summary()`, `downloadPdf()`.
CALLED_BY:
  - RentalDetailComponent
  - RentalDetailPanelComponent

COMPONENT_NAME: SignaturePadComponent
TYPE: Utility
PURPOSE: Canvas signature capture with resize handling.
RESPONSIBILITIES:
  - Capture strokes, expose the PNG data URL and emit `emptyChanged`.
SOURCE: `projects/shared/src/shared/components/signature-pad/signature-pad.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalAgreementComponent

COMPONENT_NAME: TransactionListItemComponent
TYPE: Utility
PURPOSE: Transaction row with optional balances, customer and deep links.
RESPONSIBILITIES:
  - Render the transaction kind, amount and links built from `document.baseURI`.
SOURCE: `projects/shared/src/shared/components/transaction/transaction-list-item.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerTransactionsComponent
  - RentalReservedPanelComponent
  - RentalTransactionsSectionComponent
  - TransactionDetailsViewComponent
  - TransactionHistoryComponent

COMPONENT_NAME: TransactionDetailsViewComponent
TYPE: Utility
PURPOSE: Full transaction details view.
RESPONSIBILITIES:
  - Render header fields, customer, operator and the ledger tables.
SOURCE: `projects/shared/src/shared/components/transaction/transaction-details-view.component.ts`
CALLS:
  - TransactionEntriesTableComponent — ledger tables.
CALLED_BY:
  - TransactionDetailsPageComponent

COMPONENT_NAME: TransactionEntriesTableComponent
TYPE: Utility
PURPOSE: Ledger entry table for a transaction.
RESPONSIBILITIES:
  - Render titled ledger entries.
SOURCE: `projects/shared/src/shared/components/transaction/transaction-entries-table.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - TransactionDetailsViewComponent

COMPONENT_NAME: PaymentMethodSelectComponent
TYPE: Utility
PURPOSE: Payment-method select implementing `ControlValueAccessor`.
RESPONSIBILITIES:
  - Offer cash, bank transfer and card terminal to a reactive form control.
SOURCE: `projects/shared/src/shared/components/payment-method/payment-method.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - TopUpDialogComponent
  - WithdrawDialogComponent

COMPONENT_NAME: DamageReportListItemComponent
TYPE: Utility
PURPOSE: Damage-report row.
RESPONSIBILITIES:
  - Render equipment, condition, penalty amount and status.
SOURCE: `projects/shared/src/shared/components/damage-report/damage-report-list-item.component.ts`
CALLS:
  - PenaltyStatusBadgeComponent — penalty status.
CALLED_BY:
  - CustomerPenaltiesComponent
  - RentalDamageReportsSectionComponent

COMPONENT_NAME: DamageReportDetailComponent
TYPE: Gateway
PURPOSE: Damage-report detail screen shared by admin and operator routes.
RESPONSIBILITIES:
  - Load the report by route id and render items, penalty and status.
SOURCE: `projects/shared/src/shared/components/damage-report/damage-report-detail.component.ts`
CALLS:
  - DamageReportDetailStore — `load()`, `report()`, `error()`, `reload()`.
  - PageHeaderComponent — screen header.
  - Location — back navigation.
CALLED_BY:
  - AdminRoutes
  - DamageReportRoutes

### Shared UI — dialogs, health, profile, QR

COMPONENT_NAME: ConfirmDialogComponent
TYPE: Utility
PURPOSE: Generic confirmation dialog with an optional danger styling.
RESPONSIBILITIES:
  - Render title, message and buttons; close with the boolean result.
SOURCE: `projects/shared/src/shared/components/confirm-dialog/confirm-dialog.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - AgreementListComponent
  - PwaUpdateService
  - RentalDetailPanelComponent
  - RentalHistoryCardListComponent
  - UsersListComponent

COMPONENT_NAME: TopUpDialogComponent
TYPE: Utility
PURPOSE: Records a customer deposit.
RESPONSIBILITIES:
  - Capture amount, payment method and source; submit the deposit and close with the result.
SOURCE: `projects/shared/src/shared/components/top-up-dialog/top-up-dialog.component.ts`
CALLS:
  - CustomerFinanceStore — `recordDeposit()`.
  - PaymentMethodSelectComponent — method selection.
  - MatSnackBar — outcome message.
CALLED_BY:
  - CustomerAccountComponent
  - RentalDetailComponent
  - RentalStep2Component
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: WithdrawDialogComponent
TYPE: Utility
PURPOSE: Records a customer withdrawal, bounded by the available balance.
RESPONSIBILITIES:
  - Capture amount and method, validate against the available balance, submit and close.
SOURCE: `projects/shared/src/shared/components/withdraw-dialog/withdraw-dialog.component.ts`
CALLS:
  - CustomerFinanceStore — `recordWithdrawal()`.
  - maxWithdrawAmountValidator — amount ceiling.
  - PaymentMethodSelectComponent — method selection.
  - MatSnackBar — outcome message.
CALLED_BY:
  - CustomerAccountComponent
  - RentalDetailComponent
  - RentalStep2Component
  - ReturnEquipmentScreenComponent

COMPONENT_NAME: TemporaryPasswordDialogComponent
TYPE: Utility
PURPOSE: Shows a generated temporary password with a copy control.
RESPONSIBILITIES:
  - Render the password once and copy it to the clipboard on request.
SOURCE: `projects/shared/src/shared/components/temporary-password-dialog/temporary-password-dialog.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - UserCreateDialogComponent
  - UsersListComponent

COMPONENT_NAME: TimeTravelDialogComponent
TYPE: Utility
PURPOSE: Sets or resets the simulated server clock.
RESPONSIBILITIES:
  - Capture the target time and apply or reset it.
SOURCE: `projects/shared/src/shared/components/time-travel-dialog/time-travel-dialog.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - TimeTravelDisplayComponent

COMPONENT_NAME: TimeTravelDisplayComponent
TYPE: Utility
PURPOSE: Toolbar chip showing the simulated clock.
RESPONSIBILITIES:
  - Render the simulated time and open the time-travel dialog.
SOURCE: `projects/shared/src/shared/components/time-travel-display/time-travel-display.component.ts`
CALLS:
  - TimeTravelDialogComponent — clock control.
CALLED_BY:
  - AppToolbarComponent

COMPONENT_NAME: HealthIndicatorComponent
TYPE: Utility
PURPOSE: Backend health pill with a CDK overlay tooltip.
RESPONSIBILITIES:
  - Render the status colour and build the tooltip lines from components, server info and last check time.
SOURCE: `projects/shared/src/shared/components/health-indicator/health-indicator.component.ts`
CALLS:
  - HealthService — status, components, server info, last checked, error.
  - HealthTooltipComponent — tooltip body.
CALLED_BY:
  - AdminLayoutComponent
  - OperatorLayoutComponent

COMPONENT_NAME: HealthTooltipComponent
TYPE: Utility
PURPOSE: Tooltip body listing health lines.
RESPONSIBILITIES:
  - Render one row per tooltip line.
SOURCE: `projects/shared/src/shared/components/health-indicator/health-tooltip.component.ts`
CALLS:
  - HealthTooltipLineComponent — row rendering.
CALLED_BY:
  - HealthIndicatorComponent

COMPONENT_NAME: HealthTooltipLineComponent
TYPE: Utility
PURPOSE: Single label/value row of the health tooltip.
RESPONSIBILITIES:
  - Render the label and value.
SOURCE: `projects/shared/src/shared/components/health-indicator/health-tooltip-line.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - HealthTooltipComponent

COMPONENT_NAME: ProfileMenuComponent
TYPE: Utility
PURPOSE: Avatar menu with the settings link and logout.
RESPONSIBILITIES:
  - Render the current user and emit `logout`.
SOURCE: `projects/shared/src/shared/components/profile-menu/profile-menu.component.ts`
CALLS:
  - UserStore — `currentUser()`.
  - UserAvatarComponent — avatar rendering.
CALLED_BY:
  - AdminLayoutComponent
  - OperatorLayoutComponent

COMPONENT_NAME: ProfileSettingsComponent
TYPE: Utility
PURPOSE: Profile settings route host with tabbed child routes.
RESPONSIBILITIES:
  - Render the header and tab bar over the child outlet.
SOURCE: `projects/shared/src/shared/components/profile-settings/profile-settings.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - ProfileSettingsRoutes

COMPONENT_NAME: ProfileAccountComponent
TYPE: Utility
PURPOSE: Account tab of profile settings.
RESPONSIBILITIES:
  - Edit and save the display name and contact fields.
SOURCE: `projects/shared/src/shared/components/profile-settings/profile-account.component.ts`
CALLS:
  - UserStore — `currentUser()`.
  - ProfileStore — `saveProfile()`.
  - UserAvatarComponent — avatar rendering.
CALLED_BY:
  - ProfileSettingsRoutes

COMPONENT_NAME: ProfileSecurityComponent
TYPE: Utility
PURPOSE: Security tab — change password.
RESPONSIBILITIES:
  - Validate against the password policy, submit and report the outcome.
SOURCE: `projects/shared/src/shared/components/profile-settings/profile-security.component.ts`
CALLS:
  - ProfileStore — `changePassword()`, `saving()`.
  - passwordPolicyValidator / passwordsMatchValidator — password rules.
  - NotificationService / ErrorMessageResolver — outcome reporting.
CALLED_BY:
  - ProfileSettingsRoutes

COMPONENT_NAME: ProfilePreferencesComponent
TYPE: Utility
PURPOSE: Preferences tab — locale and theme.
RESPONSIBILITIES:
  - Persist preference patches as they change.
SOURCE: `projects/shared/src/shared/components/profile-settings/profile-preferences.component.ts`
CALLS:
  - UserStore — `preferences()`.
  - ProfileStore — `savePreferences()`.
CALLED_BY:
  - ProfileSettingsRoutes

COMPONENT_NAME: ProfileConnectedComponent
TYPE: Utility
PURPOSE: Connected-accounts tab (static placeholder — no provider is wired).
RESPONSIBILITIES:
  - Render the not-connected state.
SOURCE: `projects/shared/src/shared/components/profile-settings/profile-connected.component.ts`
CALLS:
  - NONE
CALLED_BY:
  - ProfileSettingsRoutes

COMPONENT_NAME: QrScannerComponent
TYPE: Utility
PURPOSE: Camera QR/barcode scanner.
RESPONSIBILITIES:
  - Acquire the camera stream, run detection and emit `scanned` or a typed `scanError`.
  - Release camera tracks on destroy.
SOURCE: `projects/shared/src/shared/components/qr-scanner/qr-scanner.component.ts`
CALLS:
  - BarcodeScannerService — detector creation and detection.
  - QR_PAYLOAD_PARSER — extract the UID from the payload.
CALLED_BY:
  - QrScanDialogComponent

COMPONENT_NAME: QrScanDialogComponent
TYPE: Utility
PURPOSE: Dialog wrapper around the scanner, closing with the scanned UID.
RESPONSIBILITIES:
  - Host the scanner and close with the decoded value.
SOURCE: `projects/shared/src/shared/components/qr-scanner/qr-scan-dialog.component.ts`
CALLS:
  - QrScannerComponent — camera scanning.
CALLED_BY:
  - RentalEquipmentSectionComponent
  - ReturnComponent

COMPONENT_NAME: BarcodeScannerService
TYPE: Service
PURPOSE: Detector factory abstracting the native and polyfilled barcode detectors.
RESPONSIBILITIES:
  - Create a `QrDetector` and run detection against a video frame.
SOURCE: `projects/shared/src/shared/components/qr-scanner/barcode-scanner.service.ts`
CALLS:
  - NONE
CALLED_BY:
  - QrScannerComponent

### Shared UI — directives, pipes and utilities

COMPONENT_NAME: MaxDecimalsDirective
TYPE: Utility
PURPOSE: Truncates input beyond the configured number of decimal places.
RESPONSIBILITIES:
  - Rewrite the input value and re-dispatch the input event.
SOURCE: `projects/shared/src/shared/directives/max-decimals.directive.ts`
CALLS:
  - truncateDecimalPlaces — truncation helper.
CALLED_BY:
  - InlineNumberInputComponent
  - ReportDamageSheetComponent
  - TopUpDialogComponent
  - WithdrawDialogComponent

COMPONENT_NAME: PhoneCharactersOnlyDirective
TYPE: Utility
PURPOSE: Restricts an input to phone characters on typing and paste.
RESPONSIBILITIES:
  - Filter keydown, input and paste events.
SOURCE: `projects/shared/src/shared/directives/phone-characters-only.directive.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerCreateInlineFormComponent
  - CustomerSearchInputComponent
  - RentalFilterComponent
  - TransactionFilterComponent

COMPONENT_NAME: MoneyPipe
TYPE: Utility
PURPOSE: Formats a `Money` value, optionally signed.
RESPONSIBILITIES:
  - Render the amount with its currency symbol.
SOURCE: `projects/shared/src/shared/pipes/money.pipe.ts`
CALLS:
  - NONE
CALLED_BY:
  - ChangePriceSheetComponent
  - CustomerAccountComponent
  - CustomerBalancePillComponent
  - CustomerDetailComponent
  - CustomerEquipmentTableComponent
  - CustomerRentalListItemComponent
  - CustomerSpendTableComponent
  - DamageReportDetailComponent
  - DamageReportHistoryComponent
  - DamageReportListItemComponent
  - EquipmentUnitCardComponent
  - EquipmentUnitDetailsComponent
  - RentalAgreementComponent
  - RentalBalanceWarningComponent
  - RentalCostFooterComponent
  - RentalCostSectionComponent
  - RentalDetailComponent
  - RentalDetailSummaryComponent
  - RentalPriceControlComponent
  - RentalReservedPanelHeaderComponent
  - RentalTableComponent
  - ReturnSettlementSummaryComponent
  - RevenueBucketTableComponent
  - RevenueMetricTileComponent
  - TransactionDetailsViewComponent
  - TransactionEntriesTableComponent
  - TransactionListItemComponent
  - WithdrawDialogComponent

COMPONENT_NAME: LocalTimestampPipe
TYPE: Utility
PURPOSE: Formats a timestamp in the active locale.
RESPONSIBILITIES:
  - Render `dd.MM.yyyy HH:mm` or the empty placeholder.
SOURCE: `projects/shared/src/shared/pipes/local-timestamp.pipe.ts`
CALLS:
  - NONE
CALLED_BY:
  - DamageReportDetailComponent
  - DamageReportHistoryComponent
  - DamageReportListItemComponent
  - RentalDetailPanelComponent
  - RentalTableComponent
  - TransactionDetailsViewComponent
  - TransactionListItemComponent

COMPONENT_NAME: DurationPipe
TYPE: Utility
PURPOSE: Formats a minute count as a human duration.
RESPONSIBILITIES:
  - Render hours and minutes, optionally signed.
SOURCE: `projects/shared/src/shared/pipes/duration.pipe.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalAgreementComponent
  - RentalCardComponent
  - RentalPeriodSectionComponent

COMPONENT_NAME: ShortIdPipe
TYPE: Utility
PURPOSE: Shortens long identifiers for display.
RESPONSIBILITIES:
  - Render the trailing visible characters of an id.
SOURCE: `projects/shared/src/shared/pipes/short-id.pipe.ts`
CALLS:
  - NONE
CALLED_BY:
  - RentalDetailPanelComponent
  - RentalTableComponent

COMPONENT_NAME: TruncatePipe
TYPE: Utility
PURPOSE: Truncates long text to a maximum length.
RESPONSIBILITIES:
  - Render a shortened string with an ellipsis.
SOURCE: `projects/shared/src/shared/pipes/truncate.pipe.ts`
CALLS:
  - NONE
CALLED_BY:
  - EquipmentListComponent

COMPONENT_NAME: PricePrefixPipe
TYPE: Utility
PURPOSE: Prefixes a price with the approximate or final marker.
RESPONSIBILITIES:
  - Render the localized price prefix.
SOURCE: `projects/shared/src/shared/pipes/price-prefix.pipe.ts`
CALLS:
  - NONE
CALLED_BY:
  - EquipmentUnitCardComponent

COMPONENT_NAME: DeployedPath
TYPE: Utility
PURPOSE: Single source of truth for the deployed URL shape (origin, prefix, app, locale, route).
RESPONSIBILITIES:
  - Parse the base URI and current location into prefix, app, locale and route parts.
  - Rebuild URLs immutably through `withApp()`, `withLocale()` and `withRoute()`.
  - Keep app and locale segment maps in one place.
SOURCE: `projects/shared/src/shared/utils/deployed-path.ts`
CALLS:
  - NONE
CALLED_BY:
  - CustomerRentalListItemComponent
  - DamageReportDetailComponent
  - DamageReportHistoryComponent
  - HomeComponent
  - LocaleRedirectService
  - TransactionListItemComponent

COMPONENT_NAME: Labels
TYPE: Utility
PURPOSE: The `$localize` catalogue of user-visible UI strings.
RESPONSIBILITIES:
  - Provide every static label and label map used in templates and TypeScript.
SOURCE: `projects/shared/src/shared/constant/labels.ts`
CALLS:
  - NONE
CALLED_BY:
  - All components in `projects/admin`, `projects/operator`, `projects/gateway` and `projects/shared/src/shared`

COMPONENT_NAME: FormErrorMessages
TYPE: Utility
PURPOSE: The `$localize` catalogue of reactive-form validation messages.
RESPONSIBILITIES:
  - Provide the message for each validator key used across the workspace.
SOURCE: `projects/shared/src/shared/validators/form-error-messages.ts`
CALLS:
  - NONE
CALLED_BY:
  - All dialog and form components

COMPONENT_NAME: server-errors.util
TYPE: Utility
PURPOSE: Binds backend field errors onto reactive form controls.
RESPONSIBILITIES:
  - `applyServerErrors` sets a `server` error per matching control and returns unmatched messages.
  - `resolveGeneralErrors` extracts non-field messages; `clearServerErrors` resets them.
SOURCE: `projects/shared/src/core/errors/server-errors.util.ts`
CALLS:
  - ErrorMessageResolver — localize each field error.
CALLED_BY:
  - UserCreateDialogComponent
  - UserEditDialogComponent
  - ReportDamageSheetComponent
  - ChangePriceSheetComponent

COMPONENT_NAME: suppressErrorNotification
TYPE: Utility
PURPOSE: Builds the `HttpContext` that opts a request out of the global error toast.
RESPONSIBILITIES:
  - Set `SUPPRESS_ERROR_NOTIFICATION` so a caller can handle the error locally.
SOURCE: `projects/shared/src/core/errors/http-error-context.ts`
CALLS:
  - NONE
CALLED_BY:
  - AgreementSigningStore
  - AgreementTemplateStore
  - ChangePasswordComponent
  - CustomerAnalyticsStore
  - CustomerEquipmentBreakdownStore
  - DamageReportDetailStore
  - DamageReportStore
  - EquipmentTypeRevenueSource
  - EquipmentUnitRevenueSource
  - OperatorRevenueSource
  - ProfileStore
  - RentalListStore
  - RentalSearchStore
  - RentalSignatureStore
  - RentalStore
  - RentalTransactionsStore
  - ReportDamageSheetComponent
  - TariffStore
  - TransactionDetailsStore
  - TransactionSearchStore
  - UserCreateDialogComponent
  - UserEditDialogComponent
  - UsersListComponent
---

## Component Call Sequences

### Use-Case 1: Operator creates a rental and sends it to signing

STEP 1: OperatorRoutes → RentalCreateComponent
  OPERATION: `loadComponent()` for `rentals/new`
  PURPOSE: Enter the wizard and instantiate the rental store graph provided on this component.
  SOURCE: `projects/operator/src/app/app.routes.ts`

STEP 2: RentalCreateComponent → RentalStep1Component
  OPERATION: render step 0
  PURPOSE: Ask the operator to identify the customer before anything else is composed.
  SOURCE: `projects/operator/src/app/rental-create/rental-create.component.ts`

STEP 3: CustomerSearchInputComponent → CustomerListStore
  OPERATION: `search(phone)`
  PURPOSE: Find an existing customer by phone number with debouncing and a minimum length.
  SOURCE: `projects/operator/src/app/rental-create/step1/customer-search-input.component.ts`

STEP 4: CustomerListStore → CustomersService
  OPERATION: `getAll(phone)`
  PURPOSE: Query the backend for matching customers.
  SOURCE: `projects/shared/src/core/state/customer-list.store.ts`

STEP 5: CustomerListStore → CustomerMapper
  OPERATION: `fromSearchResponse(response)`
  PURPOSE: Convert raw search responses into `Customer` domain objects.
  SOURCE: `projects/shared/src/core/state/customer-list.store.ts`

STEP 6: RentalStep1Component → RentalStore
  OPERATION: `setCustomer(customer, { hydrateNotes: true })`
  PURPOSE: Attach the chosen customer to the rental draft and load their notes.
  SOURCE: `projects/operator/src/app/rental-create/step1/rental-step1.component.ts`

STEP 7: RentalStore → CustomerFinanceStore
  OPERATION: `loadById(customerId)`
  PURPOSE: Fetch the customer balance that gates whether the rental may proceed.
  SOURCE: `projects/shared/src/core/state/rental.store.ts`

STEP 8: RentalStep1Component → RentalCreateComponent
  OPERATION: `customerSelected` output
  PURPOSE: Advance the wizard to step 2.
  SOURCE: `projects/operator/src/app/rental-create/step1/rental-step1.component.ts`

STEP 9: RentalEquipmentSectionComponent (create flow) → EquipmentSearchStore
  OPERATION: `search(query)`
  PURPOSE: Find equipment that is available for the requested period.
  SOURCE: `projects/operator/src/app/rental-create/step2/rental-equipment-section.component.ts`

STEP 10: EquipmentSearchStore → RentalsService
  OPERATION: `getAvailableEquipments(query)`
  PURPOSE: Ask the backend which units can still be rented.
  SOURCE: `projects/shared/src/core/state/equipment-search.store.ts`

STEP 11: RentalStep2Component → RentalStore
  OPERATION: `addEquipmentItem(item)`
  PURPOSE: Add the selected unit to the draft composition.
  SOURCE: `projects/operator/src/app/rental-create/step2/rental-step2.component.ts`

STEP 12: RentalStep2Component → RentalStore
  OPERATION: `save()`
  PURPOSE: Persist the draft as soon as the first unit is added, so the wizard has a rental id.
  SOURCE: `projects/operator/src/app/rental-create/step2/rental-step2.component.ts`

STEP 13: RentalStore → RentalsService
  OPERATION: `createRental(request)`
  PURPOSE: Create the DRAFT rental on the backend.
  SOURCE: `projects/shared/src/core/state/rental.store.ts`

STEP 14: RentalStep2Component → Location
  OPERATION: `replaceState('/rentals/{id}/edit')`
  PURPOSE: Turn the create URL into an edit URL so a reload resumes the same draft.
  SOURCE: `projects/operator/src/app/rental-create/step2/rental-step2.component.ts`

STEP 15: RentalCostCalculationStore → TariffStore
  OPERATION: `calculateCost(request)`
  PURPOSE: Recompute the live estimate after the composition or duration changes (300 ms debounce).
  SOURCE: `projects/shared/src/core/state/rental-cost-calculation.store.ts`

STEP 16: TariffStore → TariffsService
  OPERATION: cost calculation endpoint
  PURPOSE: Have the backend price the current composition.
  SOURCE: `projects/shared/src/core/state/tariff.store.ts`

STEP 17: RentalCostCalculationStore → CostCalculationMapper
  OPERATION: `fromState(draft, specialTariffId)` then `fromResponse(response)`
  PURPOSE: Build the request (stamping the simulated clock when time travel is on) and parse the estimate.
  SOURCE: `projects/shared/src/core/state/rental-cost-calculation.store.ts`

STEP 18: RentalValidationStore → RentalCostFooterComponent
  OPERATION: `canProceed()` / `balanceShortfall()`
  PURPOSE: Enable or block the primary action based on the projected balance.
  SOURCE: `projects/shared/src/core/state/rental-validation.store.ts`

STEP 19: RentalStep2Component → TopUpDialogComponent
  OPERATION: `MatDialog.open(...)` when the balance is short
  PURPOSE: Record a deposit so the rental can proceed.
  SOURCE: `projects/operator/src/app/rental-create/step2/rental-step2.component.ts`

STEP 20: TopUpDialogComponent → CustomerFinanceStore
  OPERATION: `recordDeposit(write)`
  PURPOSE: Credit the customer account through the finance API.
  SOURCE: `projects/shared/src/shared/components/top-up-dialog/top-up-dialog.component.ts`

STEP 21: RentalStep2Component → RentalStore
  OPERATION: `proceedToSigning()`
  PURPOSE: Move the rental from DRAFT to AWAITING_SIGNATURE.
  SOURCE: `projects/operator/src/app/rental-create/step2/rental-step2.component.ts`

STEP 22: RentalStep2Component → Router
  OPERATION: `navigate(['/rentals', id, 'agreement'], { state: { version } })`
  PURPOSE: Hand off to the signing screen, carrying the optimistic-locking version.
  SOURCE: `projects/operator/src/app/rental-create/step2/rental-step2.component.ts`

STEP 23: RentalAgreementComponent → AgreementSigningStore
  OPERATION: `loadRentalAgreement(rentalId)`
  PURPOSE: Fetch the rendered agreement text for this rental.
  SOURCE: `projects/operator/src/app/rental-agreement/rental-agreement.component.ts`

STEP 24: RentalAgreementComponent → SignaturePadComponent
  OPERATION: read the captured PNG data URL
  PURPOSE: Obtain the customer signature image.
  SOURCE: `projects/operator/src/app/rental-agreement/rental-agreement.component.ts`

STEP 25: RentalAgreementComponent → AgreementSigningStore
  OPERATION: `sign(rentalId, signaturePng, rentalVersion)`
  PURPOSE: Submit the signature and activate the rental.
  SOURCE: `projects/operator/src/app/rental-agreement/rental-agreement.component.ts`

STEP 26: AgreementSigningStore → AgreementsService
  OPERATION: sign endpoint
  PURPOSE: Persist the signature; the backend transitions the rental to ACTIVE.
  SOURCE: `projects/shared/src/core/state/agreement-signing.store.ts`

STEP 27: RentalAgreementComponent → Router
  OPERATION: `navigate(['/rentals', id])`
  PURPOSE: Land the operator on the active rental detail screen.
  SOURCE: `projects/operator/src/app/rental-agreement/rental-agreement.component.ts`

### Use-Case 2: Operator returns equipment by scanning its QR code

STEP 1: OperatorRoutes → ReturnComponent
  OPERATION: `loadComponent()` for `return`
  PURPOSE: Open the return entry point from the bottom navigation.
  SOURCE: `projects/operator/src/app/app.routes.ts`

STEP 2: ReturnComponent → QrScanDialogComponent
  OPERATION: `MatDialog.open(...)` via `afterNextRender`
  PURPOSE: Start the camera immediately so the operator can scan without an extra tap.
  SOURCE: `projects/operator/src/app/return/return.component.ts`

STEP 3: QrScanDialogComponent → QrScannerComponent
  OPERATION: render and start detection
  PURPOSE: Acquire the camera stream and decode frames.
  SOURCE: `projects/shared/src/shared/components/qr-scanner/qr-scan-dialog.component.ts`

STEP 4: QrScannerComponent → BarcodeScannerService
  OPERATION: `createDetector()` then `detect(frame)`
  PURPOSE: Decode the equipment UID from the video frame.
  SOURCE: `projects/shared/src/shared/components/qr-scanner/qr-scanner.component.ts`

STEP 5: ReturnComponent → RentalLookupStore
  OPERATION: `lookup(uid)`
  PURPOSE: Find the active rental that currently holds the scanned unit.
  SOURCE: `projects/operator/src/app/return/return.component.ts`

STEP 6: RentalLookupStore → RentalsService
  OPERATION: `getRentals({ status: ACTIVE, equipmentUid })`
  PURPOSE: Resolve the UID to a rental id, or report not found.
  SOURCE: `projects/shared/src/core/state/rental-lookup.store.ts`

STEP 7: ReturnComponent → Router
  OPERATION: `navigate(['/rentals', id], { queryParams: { selectUid } })`
  PURPOSE: Open the rental with the scanned unit preselected.
  SOURCE: `projects/operator/src/app/return/return.component.ts`

STEP 8: RentalDetailComponent → RentalStore
  OPERATION: `loadDetail(id)`
  PURPOSE: Load the rental aggregate for the detail screen.
  SOURCE: `projects/operator/src/app/rental-detail/rental-detail.component.ts`

STEP 9: RentalStore → BatchRentalPropertyStore
  OPERATION: `fetch$({ customerId, equipmentIds })`
  PURPOSE: Resolve the customer and every equipment unit of the rental in one batch.
  SOURCE: `projects/shared/src/core/state/rental.store.ts`

STEP 10: RentalStore → RentalDashboardMapper
  OPERATION: `toDetailState(rental, customer, equipmentItems)`
  PURPOSE: Build the detail state consumed by every section of the screen.
  SOURCE: `projects/shared/src/core/state/rental.store.ts`

STEP 11: RentalDetailComponent → RentalStore
  OPERATION: `selectEquipmentItem(id)` for the `selectUid` query parameter
  PURPOSE: Preselect the scanned unit for return.
  SOURCE: `projects/operator/src/app/rental-detail/rental-detail.component.ts`

STEP 12: RentalActionButtonsComponent → RentalDetailComponent
  OPERATION: `returnRequested` output
  PURPOSE: Switch the screen into return mode.
  SOURCE: `projects/operator/src/app/rental-detail/rental-action-buttons.component.ts`

STEP 13: ReturnEquipmentScreenComponent → ReturnEquipmentCostStore
  OPERATION: live estimate over the selected items
  PURPOSE: Show what the return will cost before anything is committed.
  SOURCE: `projects/operator/src/app/rental-detail/return-equipment-screen/return-equipment-screen.component.ts`

STEP 14: ReturnEquipmentCostStore → FinanceService
  OPERATION: `getTransactionHistory(sourceType: RENTAL)`
  PURPOSE: Determine the amount currently held against the rental.
  SOURCE: `projects/shared/src/core/state/return-equipment-cost.store.ts`

STEP 15: ReturnEquipmentScreenComponent → ReturnEquipmentCostStore
  OPERATION: `enterQuoteMode()` then `createQuote()`
  PURPOSE: Freeze the price server-side so the settlement cannot drift while the operator confirms.
  SOURCE: `projects/operator/src/app/rental-detail/return-equipment-screen/return-equipment-screen.component.ts`

STEP 16: ReturnEquipmentCostStore → TariffStore
  OPERATION: `createQuote(request)`
  PURPOSE: Obtain a quote id with an expiry from the backend.
  SOURCE: `projects/shared/src/core/state/return-equipment-cost.store.ts`

STEP 17: ReturnSettlementSummaryComponent → ReturnEquipmentCostStore
  OPERATION: `settlement()` / `heldAmount()`
  PURPOSE: Present the refund or additional charge implied by the quote.
  SOURCE: `projects/operator/src/app/rental-detail/return-equipment-screen/return-settlement-summary.component.ts`

STEP 18: ReturnEquipmentScreenComponent → RentalStore
  OPERATION: `confirmReturn(quoteId)`
  PURPOSE: Commit the return against the frozen quote.
  SOURCE: `projects/operator/src/app/rental-detail/return-equipment-screen/return-equipment-screen.component.ts`

STEP 19: RentalStore → RentalsService
  OPERATION: confirm-return endpoint with `SUPPRESS_ERROR_NOTIFICATION`
  PURPOSE: Settle the rental while letting the screen handle quote-specific errors itself.
  SOURCE: `projects/shared/src/core/state/rental.store.ts`

STEP 20: ReturnEquipmentScreenComponent → ReturnEquipmentCostStore
  OPERATION: `createQuote()` again on `TARIFF_QUOTE_EXPIRED` / `TARIFF_QUOTE_NOT_FOUND` / `RENTAL_QUOTE_MISMATCH`
  PURPOSE: Re-quote and let the operator confirm the refreshed settlement.
  SOURCE: `projects/operator/src/app/rental-detail/return-equipment-screen/return-equipment-screen.component.ts`

STEP 21: ReturnEquipmentScreenComponent → RentalDetailRefreshFacade
  OPERATION: `refreshAll(rentalId)`
  PURPOSE: Reload rental, transactions, balance and damage reports after the settlement.
  SOURCE: `projects/operator/src/app/rental-detail/return-equipment-screen/return-equipment-screen.component.ts`

STEP 22: RentalDetailRefreshFacade → RentalStore
  OPERATION: `loadDetail$(id, { silent: true })`
  PURPOSE: Refresh the aggregate without flashing the loading state.
  SOURCE: `projects/shared/src/core/state/rental-detail-refresh.facade.ts`

---

## Communication Channels

- CHANNEL_TYPE: HTTP
  ENDPOINT/EXCHANGE/TOPIC: `{environment.apiUrl}` + every path in the OpenAPI spec, reached through the generated services (agreements, analytics, customers, equipment catalogue, equipment types, finance, identity, maintenance, rentals, tariffs, time travel, users)
  SOURCE: `projects/shared/src/core/api/generated/services/`, base path from `provideDefaultClient({ basePath: environment.apiUrl })`
  NOTES: The only sanctioned API transport. `DefaultBaseInterceptor` prefixes the base path; `apiAuthInterceptor` adds the bearer token (admin/operator only); `acceptLanguageInterceptor` adds `Accept-Language`; `errorInterceptor` parses and toasts failures.

- CHANNEL_TYPE: HTTP
  ENDPOINT/EXCHANGE/TOPIC: `{environment.apiUrl}/actuator/health`, `{environment.apiUrl}/actuator/info`
  SOURCE: `projects/shared/src/core/health/health.service.ts`
  NOTES: The only place `HttpClient` is used directly — these endpoints are outside the OpenAPI spec. Polled on `environment.healthPollIntervalMs` (300000 ms) by `HealthPollerService` in all three apps.

- CHANNEL_TYPE: HTTP
  ENDPOINT/EXCHANGE/TOPIC: agreement PDF download and preview (binary `application/pdf` responses)
  SOURCE: `projects/shared/src/core/state/rental-signature.store.ts`, `projects/shared/src/core/state/agreement-template.store.ts`
  NOTES: Blob responses; the preview dialog wraps the blob in an object URL and revokes it on close.

- CHANNEL_TYPE: HTTP
  ENDPOINT/EXCHANGE/TOPIC: OIDC authorization, token and end-session endpoints derived from `environment.apiUrl`
  SOURCE: `projects/shared/src/core/auth/auth.config.ts`
  NOTES: Handled entirely by `angular-auth-oidc-client`; client ids `bike-rental-admin` and `bike-rental-operator`. The gateway performs no authentication.

- CHANNEL_TYPE: Webhook
  ENDPOINT/EXCHANGE/TOPIC: `{environment.apiUrl}/api/dev/time` (Server-Sent Events stream)
  SOURCE: `projects/shared/src/core/state/time-travel.store.ts`, `projects/shared/src/core/api/event-source/sse-provider.service.ts`
  NOTES: One-way server push of the simulated clock. Subscribed only when `TIME_TRAVEL_STORE_TOKEN` resolves to a store, which happens only when `environment.timeTravelEnabled` is true (false in every checked-in environment). Torn down through `DestroyRef`.

- CHANNEL_TYPE: HTTP
  ENDPOINT/EXCHANGE/TOPIC: `POST https://api.github.com/repos/JenkaBY/bike-rental/dispatches` with `event_type: ui-image-published`
  SOURCE: `.github/workflows/build-and-deploy.yml` (`notify-server` job)
  NOTES: Build-time only, not a runtime channel. Tells the production host that a new UI image tag was pushed to GHCR.

- CHANNEL_TYPE: HTTP
  ENDPOINT/EXCHANGE/TOPIC: dev-server proxy `/admin` → `http://localhost:4201`, `/operator` → `http://localhost:4202`
  SOURCE: `proxy.conf.json`
  NOTES: Local development only — lets the gateway on port 4200 link to the other two dev servers under one origin.

---

## Dependency Registration and Wiring

DI_CONTAINER: Angular standalone injector hierarchy (environment injector per SPA, element injector per component). No NgModules anywhere.

REGISTRATION_FILE: `projects/gateway/src/app/app.config.ts`

- lifetime/scope: environment (application root)
  abstraction: routing, HTTP pipeline, locale, brand, API base path, health polling
  concrete implementation: `provideRouter(routes)`, `provideHttpClient(withInterceptors([...]))`, `provideDefaultClient(...)`, `HealthPollerService`

```typescript
provideHttpClient(withInterceptors([acceptLanguageInterceptor, errorInterceptor])),
provideAppInitializer(() => { inject(HealthPollerService); registerLocaleData(localeRu, 'ru'); return Promise.resolve(); }),
{ provide: LOCALE_ID, useValue: environment.defaultLocale },
{ provide: APP_BRAND, useValue: environment.brand ?? BRAND },
provideDefaultClient({ basePath: environment.apiUrl }),
```

REGISTRATION_FILE: `projects/admin/src/app/app.config.ts`

- lifetime/scope: environment (application root)
  abstraction: routing with component input binding, authenticated HTTP pipeline, OIDC, Material date adapter, startup lookups, locale, brand, API base path, optional time-travel store, SSE provider
  concrete implementation: `provideRouter(routes, withComponentInputBinding())`, `provideOidcAuth('bike-rental-admin')`, `importProvidersFrom(MatNativeDateModule)`, `LookupInitializerFacade`, `TimeTravelStore`, `SseService`

```typescript
provideHttpClient(withInterceptors([acceptLanguageInterceptor, apiAuthInterceptor, errorInterceptor])),
provideOidcAuth('bike-rental-admin'),
provideAppInitializer(async () => { /* health, locale, checkAuth, then lookupFacade.init(...) */ }),
provideDefaultClient({ basePath: environment.apiUrl }),
{ provide: TIME_TRAVEL_STORE_TOKEN, useFactory: () => environment.timeTravelEnabled ? new TimeTravelStore() : null },
{ provide: SSE_PROVIDER, useClass: SseService },
```

REGISTRATION_FILE: `projects/operator/src/app/app.config.ts`

- lifetime/scope: environment (application root)
  abstraction: same as admin, plus the service worker and the PWA update driver; the startup lookup additionally resolves the special tariff id
  concrete implementation: `provideOidcAuth('bike-rental-operator')`, `provideServiceWorker(...)`, `PwaUpdateService`

```typescript
provideAppInitializer(() => { inject(HealthPollerService); inject(PwaUpdateService).init(); /* checkAuth + lookups */ }),
provideOidcAuth('bike-rental-operator'),
provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode(), registrationStrategy: 'registerWhenStable:30000' }),
{ provide: TIME_TRAVEL_STORE_TOKEN, useFactory: () => environment.timeTravelEnabled ? new TimeTravelStore() : null },
{ provide: SSE_PROVIDER, useClass: SseService },
```

REGISTRATION_FILE: `projects/shared/src/core/api/generated/providers.ts`

- lifetime/scope: environment
  abstraction: generated-client base path and interceptor chain
  concrete implementation: `BASE_PATH_DEFAULT` value plus `DefaultBaseInterceptor` as a multi `HTTP_INTERCEPTORS` entry

```typescript
export function provideDefaultClient(config: DefaultConfig): EnvironmentProviders {
  const providers: Provider[] = [
    { provide: BASE_PATH_DEFAULT, useValue: config.basePath },
    { provide: HTTP_INTERCEPTORS, useClass: DefaultBaseInterceptor, multi: true },
  ];
  return makeEnvironmentProviders(providers);
}
```

REGISTRATION_FILE: `projects/operator/src/app/rental-create/rental-create.component.ts`

- lifetime/scope: component (destroyed with the wizard)
  abstraction: the rental store graph shared by both steps and every descendant
  concrete implementation: `RentalStore` (also aliased to `RENTAL_STORE_TOKEN`), `RentalValidationStore` (also `RENTAL_VALIDATION_STORE_FOR_DELEGATION`), `RentalCostCalculationStore`, `RentalTransactionsStore`, `CustomerFinanceStore`, `BatchRentalPropertyStore`, `RentalDetailRefreshFacade`

```typescript
providers: [
  BatchRentalPropertyStore, CustomerFinanceStore, RentalCostCalculationStore,
  RentalStore, RentalTransactionsStore, RentalValidationStore, RentalDetailRefreshFacade,
  { provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
  { provide: RENTAL_VALIDATION_STORE_FOR_DELEGATION, useExisting: RentalValidationStore },
],
```

REGISTRATION_FILE: `projects/operator/src/app/rental-detail/rental-detail.component.ts`

- lifetime/scope: component
  abstraction: the rental store graph for the detail and return flows
  concrete implementation: `RentalStore`, `CustomerFinanceStore`, `BatchRentalPropertyStore`, `RentalCostCalculationStore`, `RentalTransactionsStore`, `RentalDetailRefreshFacade`, `RentalSignatureStore`, `DamageReportStore`, `RENTAL_STORE_TOKEN`

REGISTRATION_FILE: `projects/admin/src/app/rentals/rental-history.component.ts` and `rental-detail-page.component.ts`

- lifetime/scope: component
  abstraction: the admin rental store graph feeding the inline detail panel
  concrete implementation: `RentalSearchStore` (list page only), `RentalStore`, `BatchRentalPropertyStore`, `RentalCostCalculationStore`, `CustomerFinanceStore`, `RentalTransactionsStore`, `RentalSignatureStore`, `DamageReportStore`

REGISTRATION_FILE: `projects/admin/src/app/analytics/analytics-page.component.ts`

- lifetime/scope: component
  abstraction: `REVENUE_REPORT_SOURCES` — the pluggable revenue report list
  concrete implementation: `OperatorRevenueSource`, `EquipmentTypeRevenueSource`, `EquipmentUnitRevenueSource`

```typescript
providers: [{
  provide: REVENUE_REPORT_SOURCES,
  useFactory: () => [inject(OperatorRevenueSource), inject(EquipmentTypeRevenueSource), inject(EquipmentUnitRevenueSource)],
}],
```

- lifetime/scope: component (other feature-scoped registrations)
  abstraction: one store instance per screen
  concrete implementation: `CustomerListStore` (customer list, rental filter, transaction filter, operator customer search), `TransactionSearchStore`, `TransactionDetailsStore`, `DamageReportStore` (admin history), `AgreementTemplateStore`, `AnalyticsRevenueStore`, `CustomerAnalyticsStore`, `CustomerEquipmentBreakdownStore`, `EquipmentUnitOptionsStore`, `RentalListStore` (operator dashboard), `EquipmentSearchStore`, `ReturnEquipmentCostStore`, `RentalPricingStore`, `DamageReportCreateStore`, `RentalLookupStore`, `CustomerStore` + `CustomerFormProvider` (inline create form)

- lifetime/scope: root (`providedIn: 'root'`)
  abstraction: cross-app singletons
  concrete implementation: `AuthService`, `UserStore`, `ProfileStore`, `EquipmentTypeStore`, `PricingTypeStore`, `EquipmentStore`, `TariffStore`, `ManagedUserStore`, `EquipmentUnitLabelStore`, `EquipmentScanResolverService`, `TimeStore`, `TimeTravelStore`, `CustomerRatingService`, `LookupInitializerFacade`, the three revenue sources, `CostCalculationMapper`, `ErrorMessageResolver`, `NotificationService`, `ErrorService`, `HealthService`, `HealthPollerService`, `SseService`, `LocaleRedirectService`, `PwaUpdateService`

---

## Configuration and Secrets

- SOURCE_TYPE: Build-time environment file (swapped by `fileReplacements`)
  KEYS: `production`, `appVersion`, `apiUrl`, `healthPollIntervalMs`, `defaultLocale`, `brand`, `timeTravelEnabled`
  SENSITIVE: NO
  LOCATION: `projects/shared/src/environments/environment.ts` (dev: `http://localhost:8080`, `defaultLocale: 'ru'`), `environment.lan.ts` (hardcoded LAN IP), `environment.staging.ts` and `environment.prod.ts` (both carry `BIKE_API_PLACEHOLDER` and `BIKE_VERSION_PLACEHOLDER`, `defaultLocale: 'en'`)

- SOURCE_TYPE: CI repository variables substituted into the environment file at build time
  KEYS: `BIKE_RENTAL_TEST_API` (pages target), `BIKE_RENTAL_API` (pi target)
  SENSITIVE: NO (host names, not credentials; the build fails hard when either is missing)
  LOCATION: `.github/workflows/build-and-deploy.yml`, step "Inject Bike Rental API host into all apps"

- SOURCE_TYPE: CI secret
  KEYS: `PI_DEPLOY_TOKEN` (GitHub dispatch token), `GITHUB_TOKEN` (GHCR login)
  SENSITIVE: YES
  LOCATION: `.github/workflows/build-and-deploy.yml` (`notify-server` and `image` jobs); never present in any shipped bundle

- SOURCE_TYPE: Build-time version stamp
  KEYS: `BIKE_VERSION_PLACEHOLDER` (environment + `ngsw-config.json` `appData.version`), `BIKE_BUILD_TIME_PLACEHOLDER`
  SENSITIVE: NO
  LOCATION: `.github/workflows/build-and-deploy.yml` step "Stamp build version"; readable at runtime from `environment.appVersion` and from the deployed `ngsw.json` `appData`

- SOURCE_TYPE: Angular workspace configuration
  KEYS: per-project `build.options` (`browser`, `polyfills`, `assets`, `styles`, `serviceWorker`, `baseHref`, `localize`), `i18n.sourceLocale` / `i18n.locales`, budgets, `fileReplacements`
  SENSITIVE: NO
  LOCATION: `angular.json` (base hrefs `/`, `/admin/`, `/operator/`; locales `en` + `ru`; service worker only on operator)

- SOURCE_TYPE: TypeScript path aliases
  KEYS: `@bikerental/shared`, `@api-models`, `@ui-models`, `@store.*`
  SENSITIVE: NO
  LOCATION: `tsconfig.json` (`@store.*` is library-internal and blocked by lint outside `projects/shared`)

- SOURCE_TYPE: OpenAPI generator configuration
  KEYS: `input` (`http://localhost:8080/v3/api-docs/all`), `output`, `dateType: 'string'`, `enumStyle: 'enum'`, `generateServices: true`
  SENSITIVE: NO
  LOCATION: `projects/shared/config/openapi.config.ts`

- SOURCE_TYPE: Service worker configuration
  KEYS: `index`, `appData.version`, `appData.buildTime`, `assetGroups` (`app` prefetch, `assets` lazy including `/zxing/**`), `navigationUrls`, `navigationRequestStrategy: 'freshness'`, `applicationMaxAge: '1d'`
  SENSITIVE: NO
  LOCATION: `projects/operator/ngsw-config.json`

- SOURCE_TYPE: PWA manifest
  KEYS: `name`, `short_name`, `start_url`, `scope`, `display`, `orientation`, `theme_color`, `icons`
  SENSITIVE: NO
  LOCATION: `projects/operator/public/manifest.webmanifest`

- SOURCE_TYPE: Dev-server proxy
  KEYS: `/admin`, `/operator` targets
  SENSITIVE: NO
  LOCATION: `proxy.conf.json`

- SOURCE_TYPE: Container routing
  KEYS: `CONTAINER_APPS` (`admin`, `operator`), `ROOT_APP` (`gateway`), `DEFAULT_LOCALE_SEGMENT` (`en`)
  SENSITIVE: NO
  LOCATION: `scripts/apps.mjs`, consumed by `scripts/gen-ui-config.mjs` to emit `docker/Caddyfile.generated`

- SOURCE_TYPE: Browser-held session data
  KEYS: OIDC tokens and well-known configuration (`sessionStorage`, managed by `angular-auth-oidc-client`), `user_settings` (`localStorage`)
  SENSITIVE: YES (access/refresh tokens)
  LOCATION: written by `provideOidcAuth` / `AuthService` and `UserStore`

---

## Persistence and Data Access

DATABASE: NONE — this workspace is a browser client only. All durable state lives in the Spring Boot backend behind `environment.apiUrl`.

DATA_ACCESS: Three enforced layers.
  1. `projects/shared/src/core/api/generated/` — `ng-openapi`-generated services and raw `*Request` / `*Response` interfaces. Consumed only by stores and mappers; never imported by a component.
  2. `projects/shared/src/core/mappers/` — static `fromResponse()` / `toRequest()` converters; `CostCalculationMapper` is the single injectable one because it must read the simulated clock.
  3. `projects/shared/src/core/models/` — UI domain interfaces; the only types components and dialogs import.
  Signal stores in `projects/shared/src/core/state/` sit above all three and are the component-facing API.

MIGRATIONS_PATH: NONE

REPOSITORY_PATTERN: NO — there are no repository abstractions or interfaces over the data source. The generated service classes are injected directly into stores, and the stores play the repository/facade role. There is exactly one hand-written HTTP call outside this pipeline (`HealthService`, for the actuator endpoints that the OpenAPI spec does not cover).

CLIENT_SIDE_STORAGE:
  - `localStorage` key `user_settings` — cached user preferences, read on boot and rewritten on change (`UserStore`), wrapped in try/catch.
  - `sessionStorage` — OIDC tokens and discovery document, owned by `angular-auth-oidc-client`; `provideOidcAuth` purges stale well-known entries before configuring.
  - Service-worker caches (`ngsw:*`) — operator app shell and assets; wiped by the CI kill switch when a bad build must be recalled.
  - In-memory caches — `EquipmentUnitLabelStore` (id → label), `EquipmentTypeStore` / `PricingTypeStore` / `TariffStore` lookup caches warmed at startup.

---

## Patterns and Architecture Notes

- PATTERN: Three-layer data pipeline (generated client → mapper → domain model)
  EVIDENCE: `core/api/generated/` is lint- and coverage-excluded and imported only by `core/mappers/` and `core/state/`; components import from `core/models/`.
  SNIPPET: NONE

- PATTERN: Class-based signal store with a private writable state and public computed projections
  EVIDENCE: Every file in `core/state/` follows `private readonly _state = signal<T>(…)` plus `readonly x = computed(...)`.
  SNIPPET:
```typescript
private readonly _state = signal<RentalState>(initialRentalState);
readonly customer = computed(() => this._state().customer);
readonly isDraft = computed(() => this.status() === RentalStatus.DRAFT);
```

- PATTERN: Store scoping by DI level — global lookups at root, feature aggregates on the parent page component
  EVIDENCE: `EquipmentTypeStore` / `TariffStore` are `providedIn: 'root'`; `RentalStore` is a bare `@Injectable()` provided on `RentalCreateComponent`, `RentalDetailComponent`, `RentalAgreementComponent` and the two admin rental pages, so sibling sections share exactly one instance and it dies with the screen.
  SNIPPET: NONE

- PATTERN: Interface token for store delegation across unrelated components
  EVIDENCE: `RENTAL_STORE_TOKEN` (`useExisting: RentalStore`) lets `RentalCustomerPanelComponent` be reused by the create, detail and return screens without importing the concrete store; `RENTAL_VALIDATION_STORE_FOR_DELEGATION` breaks the `RentalStore` ↔ `RentalValidationStore` cycle via a lazy optional injection.
  SNIPPET:
```typescript
{ provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
{ provide: RENTAL_VALIDATION_STORE_FOR_DELEGATION, useExisting: RentalValidationStore },
```

- PATTERN: Derived-only store for cross-store invariants
  EVIDENCE: `RentalValidationStore` owns no state — it composes `RentalStore`, `RentalCostCalculationStore` and `CustomerFinanceStore` into `projectedBalance`, `isBalanceSufficient`, `balanceShortfall` and `canProceed`.
  SNIPPET: NONE

- PATTERN: Refresh facade as the single post-mutation reload path
  EVIDENCE: `RentalDetailRefreshFacade.refreshAll()` / `refreshFinancials()` is called by nine components instead of each one reloading its own stores.
  SNIPPET: NONE

- PATTERN: Pluggable report sources behind a multi-provider token
  EVIDENCE: `REVENUE_REPORT_SOURCES` is an array token; `AnalyticsRevenueStore` is source-agnostic and each source declares its own metric keys, labels and scope requirement.
  SNIPPET: NONE

- PATTERN: Debounced `rxResource` for every search surface
  EVIDENCE: `CustomerListStore` (digits only, minimum length 4, 300 ms), `EquipmentSearchStore` (minimum length 2, 300 ms), `RentalCostCalculationStore` (300 ms timer before re-pricing).
  SNIPPET: NONE

- PATTERN: Quote-based settlement to prevent price drift
  EVIDENCE: The return flow estimates live, then calls `createQuote()` and confirms against the returned `quoteId`, handling `TARIFF_QUOTE_EXPIRED`, `TARIFF_QUOTE_NOT_FOUND`, `RENTAL_QUOTE_MISMATCH` and `TARIFF_QUOTE_ALREADY_CONSUMED` explicitly.
  SNIPPET: NONE

- PATTERN: Global error toast with an explicit opt-out for local handling
  EVIDENCE: `errorInterceptor` toasts every failure; any caller that renders the error itself sends the request with `suppressErrorNotification()` to avoid a double notification.
  SNIPPET:
```typescript
return this.api.confirmReturn(id, request, { context: suppressErrorNotification() });
```

- PATTERN: Backend validation errors bound onto form controls
  EVIDENCE: `applyServerErrors(form, apiError)` sets a `server` error per matching control and returns unmatched messages for a summary; used by the user dialogs, the damage sheet and the change-price sheet.
  SNIPPET: NONE

- PATTERN: Smart/dumb split with signal inputs and outputs
  EVIDENCE: Page components own DI and store orchestration; presentational components declare only `input()`/`output()` and `OnPush`. No `@Input`/`@Output` decorators and no constructor injection anywhere.
  SNIPPET: NONE

- PATTERN: URL as the source of truth for screen state
  EVIDENCE: `withComponentInputBinding()` is enabled in admin and operator; tab, filter, paging, sort, selected id and `selectUid` are all mirrored into query parameters with `replaceUrl`.
  SNIPPET: NONE

- PATTERN: Deployed-path abstraction instead of hand-built URLs
  EVIDENCE: `DeployedPath` derives origin/prefix/app/locale/route from `document.baseURI`, because the deployment prefix differs between GitHub Pages and the production host; `localeSegment()` owns the locale-code→segment map.
  SNIPPET:
```typescript
DeployedPath.fromBase(document.baseURI).withApp(app).withLocale(locale).toString();
```

- PATTERN: Lint-enforced import boundaries
  EVIDENCE: `no-restricted-imports` in `eslint.config.js` blocks deep `projects/shared/src/**` paths and the `@store.*` alias outside the library, and blocks the `@bikerental/shared` barrel *inside* the library (self-import causes cyclic module init).
  SNIPPET: NONE

- PATTERN: Non-blocking application initializer
  EVIDENCE: `provideAppInitializer` starts health polling, registers the Russian locale data and runs `checkAuth()`; lookup loading is fired as a subscription rather than awaited, so the first paint is not gated on lookup data.
  SNIPPET: NONE

- PATTERN: One locale directory, merged XLF extraction
  EVIDENCE: `npm run i18n:extract` extracts per app into `projects/shared/src/locale/`, then `scripts/merge-xlf.mjs` de-duplicates trans-units into a single `messages.xlf`; `messages.ru.xlf` is hand-maintained.
  SNIPPET: NONE

- ANTI_PATTERN_NOTE: Error handling uses three inconsistent conventions across stores — a boolean `_error` signal (rental search, transaction search, damage report, transaction details), a typed `ApiError` signal (rental transactions, damage-report detail, analytics stores), and silent `EMPTY` / `of(null)` that relies on the interceptor toast (customer, equipment, tariff, pricing-type, equipment-type).
- ANTI_PATTERN_NOTE: Two distinct classes share the name `RentalEquipmentSectionComponent` and the selector `app-rental-equipment-section` (`rental-create/step2/` and `rental-detail/`); they are never imported together, so Angular does not complain.
- ANTI_PATTERN_NOTE: `DurationInputComponent` has no importer anywhere in the workspace.
- ANTI_PATTERN_NOTE: `LookupInitializerFacade` ships `console.log` / `console.error` calls to production.
- ANTI_PATTERN_NOTE: `CustomerFinanceStore` sets a private `_balanceError` that is never exposed, so a failed balance load is invisible to the UI.
- ANTI_PATTERN_NOTE: `CustomerRatingService.getRating()` is a stub that always returns the maximum rating.
- ANTI_PATTERN_NOTE: `core/models/lookup-config.model.ts` is not re-exported from `models/index.ts`; consumers import it by relative path.

---

## Security and Operational Considerations

AUTHN_AUTHZ:
  - OIDC authorization-code flow via `angular-auth-oidc-client`, configured per SPA by `provideOidcAuth(clientId)` — `bike-rental-admin` and `bike-rental-operator`. The gateway is unauthenticated by design (static chooser only).
  - `apiAuthInterceptor` attaches the bearer token to API requests and performs a single refresh-and-replay on 401; requests may opt out with `SKIP_AUTH_RETRY`.
  - Route authorization is guard-based: `authGuard` (session), `mustChangePasswordGuard` (forced rotation), then `adminGuard` / `operatorGuard` on the layout route; `customerProfileGuard` protects the shared customer profile. Rejections land on `/forbidden`.
  - Roles and the `mustChangePassword` flag are read from access-token claims by `readAccessTokenClaims`; this is client-side gating only — the backend remains the authority.
  - Password policy (length 8–20, letters + digits, confirmation match) is enforced by `passwordPolicyValidator` / `passwordsMatchValidator` in both the forced-change screen and profile security.

KNOWN_RISKS:
  - OIDC tokens live in `sessionStorage`, so any XSS in a shipped bundle can read them; the single mitigation in this repo is the absence of `innerHTML` sinks outside the sanitized agreement PDF iframe.
  - `AgreementPdfPreviewDialogComponent` calls `bypassSecurityTrustResourceUrl` on a blob URL; safe only while the blob is one the backend just returned.
  - `environment.lan.ts` hardcodes a private LAN IP and is checked in.
  - `environment.staging.ts` and `environment.prod.ts` are byte-identical apart from which CI variable is substituted, so the GitHub Pages demo is built against a real API host from repository variables.
  - Role checks are visual; a user who alters client state can reach admin views but cannot bypass backend authorization.
  - The operator service worker can pin clients to a stale build; the kill switch (below) is the only fleet-wide recovery path.

OBSERVABILITY:
  - Backend health and version are polled every 5 minutes by `HealthPollerService` and surfaced in both layouts by `HealthIndicatorComponent` (status colour plus a tooltip listing components, server info and last check time).
  - `ErrorService` retains the last parsed `ApiError` as a signal; `errorInterceptor` parses `traceId` / `correlationId` from RFC 7807 bodies for cross-referencing with backend logs.
  - The running build is identifiable two ways: `environment.appVersion` is baked into the bundle (accurate even when a stale service worker is serving), and `appData` in the deployed `ngsw.json` describes the manifest.
  - There is no analytics, RUM or remote error-reporting integration; `LoggerService` is described in the project conventions but is not present in the source tree.

DEPLOYMENT:
  - CI (`.github/workflows/build-and-deploy.yml`) runs `quality` (Prettier check, ESLint, `tsc --noEmit`), `test` (four Vitest projects with merged coverage), then a `build` matrix over two targets that share one build definition.
  - Target `pages`: configuration `production,staging`, base href `/<repo>/…`, API from `BIKE_RENTAL_TEST_API`. Static-only, so the job writes a root redirect to `/en/`, per-app locale redirects, and a smart root `404.html` that bounces deep links with the original path in a `redirect` parameter; the matching restore script lives in each checked-in `index.html` and must stay there because `index.html` is SHA1-pinned in `ngsw.json`.
  - Target `pi`: configuration `production`, no base-href prefix, API from `BIKE_RENTAL_API`. `npm run gen:ui-config` turns the assembled tree into `docker/Caddyfile.generated`, the tree is packed into a `caddy:2-alpine` image running as UID 1201 on port 8080, and pushed to GHCR for `linux/amd64,linux/arm64` tagged `sha-<7hex>`; a repository dispatch then notifies the production host.
  - `npm run verify:ngsw` is the last step to touch the staging tree: it recomputes SHA1 for every file in each `ngsw.json` hash table and asserts one manifest per app/locale declared in `angular.json`, so a post-build mutation cannot silently pin clients to a stale version.
  - Emergency kill switch: running the workflow with `disable_service_worker: true` replaces the operator `ngsw-worker.js` with Angular's `safety-worker.js`, which unregisters the worker and deletes every `ngsw:` cache on each client's next navigation.
  - Local development runs three dev servers concurrently (gateway 4200 with the proxy, admin 4201, operator 4202); `npm run start:ru` serves the Russian locale builds.
