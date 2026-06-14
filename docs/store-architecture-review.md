# Store Architecture & Data-Flow Review

> Scope: `projects/shared/src/core/state/**`, `projects/shared/src/core/models/**`,
> `projects/shared/src/core/mappers/**`, and the smart/orchestrating components in
> `projects/admin` and `projects/operator`.
> Branch reviewed: `feature/improve-stores`. Date: 2026-06-14.
>
> Companion refactor backlog (SDD): [`requirements/REQ-STORE-REFACTOR/`](../requirements/REQ-STORE-REFACTOR/initial_user_request.md).

This review reads strictly against the source as it exists today. It does **not** propose a rewrite —
the three-layer pipeline (generated DTO → mapper → domain model → component) and the signal-store
pattern are sound. The findings below are incremental, safe steps that make the rental/customer
features easier to extend.

---

## TL;DR — the 10 things that matter

| # | Finding | Severity | Where |
|---|---------|----------|-------|
| 1 | `RentalStore.patchState()` is **public** — any component can mutate any field; state-change origins are untraceable | High (extensibility) | [rental.store.ts:49](../projects/shared/src/core/state/rental.store.ts) |
| 2 | "Is balance sufficient?" is computed in **two stores with different semantics** | High | [rental.store.ts:58](../projects/shared/src/core/state/rental.store.ts), [rental-validation.store.ts:17](../projects/shared/src/core/state/rental-validation.store.ts) |
| 3 | `RentalStore` is a **god store** (~287 lines) fusing two lifecycles (draft-create + detail/return) into one state shape | High | [rental.store.ts](../projects/shared/src/core/state/rental.store.ts) |
| 4 | **Three import styles** reach the same shared symbols (`@bikerental/shared`, `@store.*`, deep relative) | High | see §1.4 |
| 5 | `CustomerLayoutStore.isLoading` compares signal **references**, not values → always truthy (bug) | High (correctness) | [customer-layout.store.ts:15](../projects/admin/src/app/customers/customer-detail/customer-layout.store.ts) |
| 6 | `RentalValidationStore` imports its siblings via the library's own barrel → cyclic-init risk | Medium | [rental-validation.store.ts:3](../projects/shared/src/core/state/rental-validation.store.ts) |
| 7 | `BatchRentalPropertyStore` exposes a **dead signal API**; only `fetch$()` is used. Its batch logic is duplicated in `RentalListStore` | Medium | [batch-rental-property.store.ts](../projects/shared/src/core/state/batch-rental-property.store.ts) |
| 8 | Domain model `rental.model.ts` bakes in **presentation** (Tailwind badge classes + i18n labels) | Medium | [rental.model.ts:28](../projects/shared/src/core/models/rental.model.ts) |
| 9 | **Store-state shapes** (`RentalState`, `RentalDetailState`) live in `core/models` next to domain entities | Medium | [rental-create.model.ts:32](../projects/shared/src/core/models/rental-create.model.ts) |
| 10 | `RENTAL_STORE_TOKEN` abstraction is **half-applied** — two components use the token, four use the concrete class | Low | see §3 |

---

## 1. Store Architecture

### 1.1 Inventory

There are **20 stores**, **1 facade**, and **2 injection-token contracts**. Most live in
`projects/shared/src/core/state/`; three are admin-local.

**Global singletons** (`@Injectable({ providedIn: 'root' })`) — lookup/catalogue/session data:

| Store | State | Public API (selectors / mutators) | Injects |
|-------|-------|-----------------------------------|---------|
| `EquipmentTypeStore` | `_types`, loading, saving + `TYPE_CONFIG` | `types`, `typesForEquipment`; `load/create/update` | – |
| `EquipmentStatusStore` | `_statuses`, loading, saving | `statuses`; `load/create/update` | – |
| `PricingTypeStore` | `_pricingTypes`, loading | `pricingTypes`; `load` | – |
| `TariffStore` | `_tariffs`, paging, `_specialTariffId` | `tariffs`, `specialTariffId`, paging; `load/create/update/activate/deactivate/resolveSpecialTariff/calculateCost` | `EquipmentTypeStore`, `PricingTypeStore` |
| `EquipmentStore` | `_page`, filters, paging | `items`, `totalItems`, filters; `load/setFilter*/setPage/create/update` | `EquipmentTypeStore`, `EquipmentStatusStore` |
| `UserStore` | `_currentUser`, `_preferences` (localStorage `effect`) | `currentUser`, `isAuthenticated`, `userRoles`, `preferences`; `login/setUser/clearUser/updatePreferences` | `LocaleRedirectService` |
| `TimeTravelStore` | `_serverTime` (SSE), `_uiTime` | `serverTime`, `uiTime`; `setTime/resetTime/getCurrentTime` | `SSE_PROVIDER`, `TimeTravelControllerService` |
| `TimeStore` | – (thin wrapper) | `getCurrentDate()` | `TIME_TRAVEL_STORE_TOKEN` (optional) |
| `LookupInitializerFacade` | – (orchestrator) | `init(config)` | `EquipmentStatusStore`, `EquipmentTypeStore`, `PricingTypeStore`, `TariffStore`, `UserStore` |

**Feature-scoped** (`@Injectable()` — provided in a component `providers: []`):

| Store | State | Public API | Injects |
|-------|-------|-----------|---------|
| `RentalStore` | `RentalDetailState` (~25 fields) + `selectedEquipmentItemIds`, `loadError` | **`patchState` (public)** + ~30 selectors + `setCustomer/setDuration/add/removeEquipmentItem/setDiscount/setSpecialPrice/select*/save/activateRental/returnEquipment/cancelRental/loadDetail/reset` | `BatchRentalPropertyStore`, `UserStore`, `CustomerFinanceStore`, `TariffStore` |
| `RentalCostCalculationStore` | `rxResource` (debounced cost) | `estimate`, `isCalculating` | `TariffStore`, `RentalStore`, `CostCalculationMapper` |
| `RentalValidationStore` | – (pure computed) | `projectedBalance`, `isBalanceSufficient`, `canProceed`, `estimate`, `balanceShortfall` | `RentalStore`, `RentalCostCalculationStore`, `CustomerFinanceStore` |
| `BatchRentalPropertyStore` | `_params` + `rxResource` | `isLoading`, `loadError`, `customer`, `equipmentItems`, `load/reload/fetch$` | `CustomersService`, `EquipmentsCatalogueService` |
| `RentalListStore` | `historyParams` + 2 `rxResource`s | `activeRentals`, `historyRentals`, `isLoading*`; `loadActive/loadHistory` | `RentalsService`, `CustomersService`, `EquipmentsCatalogueService` |
| `CustomerStore` | `_customer`, loading, saving | `customer`; `loadById/create/update` | `CustomersService` |
| `CustomerFinanceStore` | `_customerId`, `_balance`, loading, saving, error | `balance`, `customerId`; `loadById/refreshBalance/recordWithdrawal/recordDeposit` | `FinanceService` |
| `CustomerListStore` | debounced `_query` + `rxResource` | `customers`, `loading`, `searchQuery`; `search` | `CustomersService` |
| `EquipmentSearchStore` | debounced `_query` + `rxResource` | `results`, `loading`, `searchQuery`; `search` | `RentalsService`, `EquipmentTypeStore` |

**Admin customer-detail scoped:**

| Store | State | Public API | Injects |
|-------|-------|-----------|---------|
| `CustomerLayoutStore` | `_customerId` | `customerId`, `customer`, `balance`, `isLoading`; `init` | `CustomerStore`, `CustomerFinanceStore` |
| `CustomerRentalsStore` | `rentals`, `expandedIds`, `detailCache`, `loadingDetailIds`, `listLoading` | `load/toggleExpand/isExpanded` | `api.RentalsService`, `CustomerLayoutStore` |
| `CustomerTransactionsStore` | `_transactions`, paging, `_loaded`, loading | `transactions`, `totalItems`, paging; `load/invalidate/loadPage` | `FinanceService`, `CustomerLayoutStore` |

### 1.2 Dependency chains

```
LookupInitializerFacade ─┬─> EquipmentStatusStore
                         ├─> EquipmentTypeStore <──────┐
                         ├─> PricingTypeStore <─────┐  │
                         ├─> TariffStore ───────────┴──┤   (TariffStore -> EquipmentType + PricingType)
                         └─> UserStore                 │
EquipmentStore ──────────────────────────────────────-┤   (-> EquipmentType + EquipmentStatus)
EquipmentSearchStore ─────────────────────────────────┘   (-> EquipmentType)

RentalStore ─┬─> BatchRentalPropertyStore
             ├─> CustomerFinanceStore
             ├─> UserStore
             └─> TariffStore
RentalCostCalculationStore ─┬─> TariffStore
                            └─> RentalStore
RentalValidationStore ─┬─> RentalStore
                       ├─> RentalCostCalculationStore
                       └─> CustomerFinanceStore

CustomerLayoutStore ─┬─> CustomerStore
                     └─> CustomerFinanceStore
CustomerRentalsStore ─────> CustomerLayoutStore
CustomerTransactionsStore ─> CustomerLayoutStore

TimeStore ──(token)──> TimeTravelStore
```

**No hard runtime cycle exists**, but `RentalStore` is the **hub** of the rental cluster: it is both a
dependency of `RentalCostCalculationStore`/`RentalValidationStore` *and* a dependency-consumer of four
other stores. That bidirectional centrality is what makes the rental feature risky to change.

### 1.3 Problems

**P-A1 · `patchState()` is public (biggest traceability problem).**
[rental.store.ts:49](../projects/shared/src/core/state/rental.store.ts) exposes
`patchState(partial: Partial<RentalDetailState>)`. Any of the ~15 rental components can write any of
the ~25 state fields directly. There is no single place that defines "how the rental state legally
changes," so tracing where (say) `specialPriceEnabled` flips requires a full-text search. This is the
root cause of the rental flow feeling fragile.

**P-A2 · Two answers to "is the balance sufficient?".**
- [rental.store.ts:58](../projects/shared/src/core/state/rental.store.ts): `isBalanceSufficient = available.amount >= 0` (ignores rental cost).
- [rental-validation.store.ts:17](../projects/shared/src/core/state/rental-validation.store.ts): `isBalanceSufficient = (available - totalCost) >= 0` (the *projected* balance).

`RentalCustomerPanelComponent` (via `RENTAL_STORE_TOKEN` → `RentalStore`) shows red/green using the
first; `rental-step3`/`rental-cost-footer` gate the action button using the second. Two components on
the same screen can disagree about whether the customer can afford the rental.

**P-A3 · `RentalStore` fuses two lifecycles.**
`RentalDetailState` ([rental-dashboard.model.ts:36](../projects/shared/src/core/models/rental-dashboard.model.ts))
`extends RentalState` and adds detail/return-only fields (`finalCost`, `debtAmount`, `paidDurationMinutes`,
`brokenEquipmentEntries`, `isReturning`, …). The **create/draft** flow only needs `RentalState`; the
**detail/return** flow needs the superset. One store + one state shape serves both, so the create flow
carries (and must initialize) ~12 fields it never uses, and every change to "return" logic risks the
"create" path. Provider lists differ per flow too (see P-A4), compounding the coupling.

**P-A4 · Inconsistent provider scoping for `RentalCostCalculationStore`.**
- Create flow: provided at the page — [rental-create.component.ts:21](../projects/operator/src/app/rental-create/rental-create.component.ts).
- Detail flow: provided in a **child** — [rental-cost-section.component.ts:11](../projects/operator/src/app/rental-detail/rental-cost-section.component.ts).

`RentalValidationStore` is provided **only** in the create flow. The result: a developer adding a
cost/validation-dependent widget to the detail page will hit a `NullInjectorError` that the create page
never surfaces. Provider scope is implicit tribal knowledge.

**P-A5 · `RentalValidationStore` self-imports the library barrel.**
[rental-validation.store.ts:3](../projects/shared/src/core/state/rental-validation.store.ts) does
`import { CustomerFinanceStore, RentalCostCalculationStore, RentalStore } from '@bikerental/shared'`
from *inside* the shared library. Every other store uses relative or `@store.*` imports. Importing the
package's own public barrel from within the package is a classic source of circular module
initialization and duplicate-class-identity bugs.

**P-A6 · `BatchRentalPropertyStore` has a dead half.**
Only `fetch$()` is consumed (by `RentalStore.loadDetail`, [rental.store.ts:255](../projects/shared/src/core/state/rental.store.ts)).
The signal API — `load()`, `reload()`, `customer()`, `equipmentItems()`, `isLoading`, `loadError`, and the
internal `rxResource`/`_params` — has no caller. Half the store is dead weight, and its batch-fetch
(`forkJoin({ customer, equipmentItems })`) duplicates the enrichment in
[rental-list.store.ts:75](../projects/shared/src/core/state/rental-list.store.ts).

**P-A7 · Hidden ordering coupling in pricing mutators.**
`setDiscountPercent` and `setSpecialPrice` ([rental.store.ts:136-159](../projects/shared/src/core/state/rental.store.ts))
silently no-op depending on `specialPriceEnabled`. Callers must set the toggle *first* or their write
vanishes with no error — an implicit protocol that isn't expressed in the type system.

**P-A8 · Placeholder values leak into state.**
`operatorId` falls back to the literal `'FIX_ME'` ([rental.store.ts:63](../projects/shared/src/core/state/rental.store.ts)),
which is then sent to the backend in `mapToRequest`. `UserStore.login()` injects a hard-coded fake admin
([user.store.ts:37](../projects/shared/src/core/state/user.store.ts)). Both are known auth stubs, but
they are silent and will be easy to forget when auth lands.

### 1.4 Import-path inconsistency (cross-cutting)

The same shared classes are reachable three ways, and the codebase uses all three — sometimes in one file:

1. **Public barrel** `@bikerental/shared` — the intended path ([tsconfig.json:19](../tsconfig.json)).
2. **Per-file alias** `@store.*` → `projects/shared/src/core/state/*` ([tsconfig.json:22](../tsconfig.json)).
   Used by [customer-layout.store.ts:3](../projects/admin/src/app/customers/customer-detail/customer-layout.store.ts)
   (`@store.customer-finance.store`), [tariff-list.component.ts:21](../projects/admin/src/app/tariffs/tariff-list.component.ts)
   (`@store.tariff.store`), [lookup-initializer.facade.ts:8](../projects/shared/src/core/state/lookup-initializer.facade.ts)
   (`@store.user.store`).
3. **Deep relative across project boundaries** —
   [customer-transactions.store.ts:6](../projects/admin/src/app/customers/customer-detail/customer-transactions.store.ts)
   imports `FinanceService` from `../../../../../shared/src/core/api/generated`.

`customer-detail.component.ts` imports `CustomerStore` from the barrel but `CustomerFinanceStore` from
`@store.customer-finance.store` ([customer-detail.component.ts:7,11](../projects/admin/src/app/customers/customer-detail/customer-detail.component.ts)).
Beyond being confusing, reaching the same `@Injectable` through two module specifiers can yield two
distinct class identities under some bundler/test configs, breaking `useExisting` aliases and
`{ provide: X }` overrides in subtle ways.

---

## 2. Models & Data Contracts

### 2.1 Inventory

Domain models live in one place — `projects/shared/src/core/models/` (good) — re-exported through
[index.ts](../projects/shared/src/core/models/index.ts). Generated DTOs live in
`core/api/generated/models` and are bridged by `core/mappers/`. The three-layer split is the right
shape; the issues are drift *within* the domain layer and a few misplaced concerns.

### 2.2 Problems

**P-M1 · Overlapping rental "summary" view-models.**
Two domain types describe "a rental as a list row," both built from the same `RentalSummaryResponse`:
- `RentalListItem` ([rental-dashboard.model.ts:5](../projects/shared/src/core/models/rental-dashboard.model.ts)) via `RentalDashboardMapper.toListItem`.
- `CustomerRentalSummary` ([rental.model.ts:4](../projects/shared/src/core/models/rental.model.ts)) via `RentalMapper.fromRentalSummary`.

They share `id/status/startedAt/expectedReturnAt` but diverge on the rest (`RentalListItem` has
`isOverdue/customerName/equipmentNames`; `CustomerRentalSummary` has `estimatedCost/equipmentIds`).
Notably `RentalMapper.fromRentalSummary` hard-codes `estimatedCost: makeMoney(0)`
([rental.mapper.ts:12](../projects/shared/src/core/mappers/rental.mapper.ts)) — a field that exists but
is never populated. This is genuine drift: two mappers, two shapes, one source DTO.

**P-M2 · Overlapping equipment view-models.**
`Equipment` (full), `EquipmentSearchItem` (`{id,uid,model,type}`), and `RentalEquipmentItem`
(`extends EquipmentSearchItem` + `statusSlug/isReturned`) form a reasonable hierarchy, **but**
`EquipmentSearchItem` is produced from two different DTOs by two mappers —
`EquipmentSearchItemMapper.fromResponse` (from `EquipmentResponse`) and `.fromAvailableResponse`
(from `AvailableEquipmentResponse`). The "lite equipment" concept is fine; the duplication risk is the
twin mapper entry points drifting. Worth a single documented canonical converter.

**P-M3 · Domain model carries presentation.**
[rental.model.ts:28-85](../projects/shared/src/core/models/rental.model.ts) defines `RentalStatus` /
`EquipmentItemStatus` records whose entries embed **Tailwind classes** (`badgeClasses:
'bg-blue-100 text-blue-700'`) and **i18n labels** (`label: Labels.RentalStatusActive`). A `core/models`
domain object now depends on `shared/constant/labels` and on the app's CSS framework. Presentation
metadata belongs in a pipe or a component-level map, not in the framework-agnostic domain layer. This
also makes the model untestable without the i18n runtime.

**P-M4 · Store-state shapes filed under `core/models`.**
`RentalState` ([rental-create.model.ts:32](../projects/shared/src/core/models/rental-create.model.ts))
and `RentalDetailState` ([rental-dashboard.model.ts:36](../projects/shared/src/core/models/rental-dashboard.model.ts))
are *store internals*, not domain entities, yet they sit in — and are exported through — the public
domain-model barrel. They should be co-located with `RentalStore` in `core/state`. Today any component
can `import { RentalDetailState }` and reach into store internals.

**P-M5 · Backward-compat aliases inside a model.**
`CustomerTransaction` ([transaction.model.ts:6-19](../projects/shared/src/core/models/transaction.model.ts))
carries both canonical fields and legacy aliases (`transactionId` "alias for sourceId",
`description` "alias for reason"). Two names for one value invites readers to pick the wrong one and lets
the two drift. Pick one set; map at the boundary.

**P-M6 · "Call to developer!" placeholders as exported constants.**
`FALLBACK_EQUIPMENT_TYPE` ([equipment-type.model.ts:16](../projects/shared/src/core/models/equipment-type.model.ts))
and `FALLBACK_PRICING_TYPE` ([tariff.model.ts:46](../projects/shared/src/core/models/tariff.model.ts))
contain user-visible strings like `'Call to developer!'`. If a lookup miss ever occurs in production,
that text renders to an operator. Fallbacks should be handled at the mapper/store level with safe
defaults, not shipped as visible model constants.

### 2.3 Canonical structure (target)

```
core/
  models/            # framework-agnostic domain entities ONLY (Date fields, no CSS, no Labels)
    customer.model.ts, equipment.model.ts, tariff.model.ts, money/transaction, ...
    rental.model.ts          # Rental, RentalEquipmentItem, RentalListItem (one summary type)
  state/
    rental/
      rental.state.ts        # RentalDraftState + RentalDetailState live HERE, next to the store
      rental.store.ts
  presentation/ (or shared/) 
    rental-status.meta.ts     # badge classes + label keys (the §P-M3 map)
```

---

## 3. Component Responsibilities (smart / orchestrating)

| Component | Renders | Store(s) | Local state / events | Verdict |
|-----------|---------|----------|----------------------|---------|
| `RentalCreateComponent` | 3-step switch | provides 5 stores + token; injects `RentalStore` | `activeStep` | ✅ Clean shell |
| `RentalDetailComponent` | detail page sections | provides `RentalStore`/`CustomerFinanceStore`/`BatchRentalPropertyStore`/token; injects both stores | `id` input → `effect` loads; opens top-up/withdraw dialogs | ⚠ Mostly fine; drives `CustomerFinanceStore` directly *and* via `RentalStore`; contains dead `@let enableDiscountSection = false` ([rental-detail.component.ts:124](../projects/operator/src/app/rental-detail/rental-detail.component.ts)) |
| `RentalDashboardComponent` | active/history tabs | provides `RentalListStore` | `lastHistoryRequestDate` manual cache guard; `new Date()` directly | ⚠ One-shot history-load caching logic lives in the component; should be in the store |
| `CustomerDetailComponent` | tabbed customer shell | provides 5 stores | route-param → `layoutStore.init` | ✅ Good facade orchestration (`CustomerLayoutStore`) |
| `TariffListComponent` | admin table | injects root `TariffStore` (`@store.tariff.store`) | `toggling` map; dialogs | ✅ Standard CRUD; mixed import styles |
| `RentalCustomerPanelComponent` | customer panel | `RENTAL_STORE_TOKEN` | outputs only | ✅ The one place the token abstraction pays off |
| `RentalActionButtonsComponent` | return/cancel/broken | concrete `RentalStore` | dialogs, snackbars, navigation | ⚠ Smart leaf bound to the concrete class; can't reuse via token |

### Problems

**P-C1 · `CustomerLayoutStore.isLoading` is a real bug.**
[customer-layout.store.ts:15](../projects/admin/src/app/customers/customer-detail/customer-layout.store.ts):
```ts
readonly isLoading = computed(() => this.customerStore.loading || this.financeStore.loading);
```
`customerStore.loading` is a `Signal` (a function), not its value. `function || function` returns the
first function reference — always truthy — so `isLoading()` is permanently truthy. Must be
`this.customerStore.loading() || this.financeStore.loading()`.

**P-C2 · Cross-project deep import in a store.**
[customer-transactions.store.ts:6](../projects/admin/src/app/customers/customer-detail/customer-transactions.store.ts)
reaches `FinanceService` via `../../../../../shared/src/core/api/generated`. Admin code should consume
shared services through the published surface (`api.FinanceService` from `@bikerental/shared`), not by
tunneling into another project's `src`.

**P-C3 · `RENTAL_STORE_TOKEN` is half-applied (false decoupling).**
`RentalCustomerPanelComponent` ([rental-customer-panel.component.ts:49](../projects/operator/src/app/rental-create/step2/rental-customer-panel.component.ts))
and `RentalPricingSectionComponent` inject the token; but `RentalActionButtonsComponent`,
`RentalEquipmentSectionComponent`, `RentalPeriodSectionComponent` and the detail page all inject the
concrete `RentalStore`. The token contract ([rental-store.token.ts](../projects/shared/src/core/state/rental-store.token.ts))
therefore guarantees decoupling for two components only — a reader who trusts the abstraction will be
surprised by the four that bypass it.

**P-C4 · Component-resident caching/scheduling.**
`RentalDashboardComponent`'s `effect` + `lastHistoryRequestDate` guard
([rental-dashboard.component.ts:96-110](../projects/operator/src/app/dashboard/rental-dashboard.component.ts))
implements "load history once per day" inside the component. This is store responsibility; in the
component it's untested orchestration logic that the next tab/route change can subtly break.

---

## 4. Relationships & Data Flow

### 4.1 The rental create flow (most coupled path)

```
        ┌──────────────────────── RentalCreateComponent (provides all) ──────────────────────────┐
        │                                                                                          │
 user   │  Step1: customer search ─> CustomerListStore.search() ─> rxResource ─> CustomerStore?    │
 input  │         select customer ─> RentalStore.setCustomer() ─┐                                  │
        │                                                       ├─> CustomerFinanceStore.loadById  │
        │  Step2: equipment search ─> EquipmentSearchStore.search() ─> rxResource                  │
        │         add/remove item ─> RentalStore.add/removeEquipmentItem()                         │
        │         duration/discount/special ─> RentalStore.set*()  (ordering-coupled, P-A7)        │
        │                                            │                                             │
        │                          RentalStore.state (signal) ───────────────┐                    │
        │                                            ▼                        ▼                    │
        │             RentalCostCalculationStore (reads state, debounced) ─> estimate              │
        │                                            │                        │                    │
        │             RentalValidationStore (reads RentalStore + Cost + Finance)                   │
        │                       │ projectedBalance / isBalanceSufficient / canProceed              │
        │                       ▼                                                                   │
        │   rental-cost-footer / step3 (gate "Next"/"Activate")    rental-customer-panel           │
        │                                                          (uses RentalStore's OWN          │
        │                                                           isBalanceSufficient — P-A2)     │
        │  Step3: save ─> RentalStore.save() ─> RentalsService ─> (createDraft? -> updateRental)    │
        │         activate ─> RentalStore.activateRental() ─> updateLifecycle                       │
        └──────────────────────────────────────────────────────────────────────────────────────-┘
```

### 4.2 The detail / return flow

```
URL :id ─> RentalDetailComponent.effect ─> RentalStore.loadDetail(id)
                                              │
              RentalsService.getRentalById ──┤
                                              └─> BatchRentalPropertyStore.fetch$({equipmentIds, customerId})
                                                       │ (forkJoin customer + batch equipment)
              RentalDashboardMapper.toDetailState ─────┘ ─> patchState(state) + setCustomer
                                                                      │
                 store signals ─> period / cost / equipment / action-buttons sections
                 action-buttons ─> returnEquipment()/cancelRental() ─> RentalsService ─> navigate('/rentals')
```

### 4.3 Most fragile relationships (these block new features)

1. **`RentalStore` ⇄ rental cluster via public `patchState` + dual lifecycle (P-A1, P-A3).** Any new
   rental feature edits a shared, mutable-by-everyone state shape that serves two flows. Highest blast radius.
2. **Dual balance-sufficiency (P-A2).** Any balance-gated feature (deposits, holds, partial returns)
   must guess which of the two truths to extend.
3. **Implicit provider scope (P-A4).** Adding a cost/validation widget to the detail page fails at
   runtime, not compile time.
4. **Import-path entropy (§1.4).** Refactors and DI overrides behave differently depending on which of
   three import styles a file happened to use.

---

## 5. Prioritized, incremental refactoring plan

Ordered by *impact on extensibility per unit of risk*. Each step is independently shippable.
Full SDD write-up: [`requirements/REQ-STORE-REFACTOR/`](../requirements/REQ-STORE-REFACTOR/initial_user_request.md).

### Phase 0 — Correctness quick wins (hours, zero design change)
- **0.1** Fix `CustomerLayoutStore.isLoading` to call the signals (P-C1). → `FR-01`
- **0.2** Replace the cross-project deep import in `CustomerTransactionsStore` with `api.FinanceService`
  from the barrel (P-C2). → `FR-01`
- **0.3** Delete dead `@let enableDiscountSection = false` branch in `rental-detail.component.ts` (P-C / housekeeping).

### Phase 1 — Encapsulation & single sources of truth (highest leverage)
- **1.1** Make `RentalStore.patchState` **private**; expose only intent-named mutators (most already exist).
  Update `RentalDashboardMapper.toDetailState` callers to go through a single `applyDetail(state)` method (P-A1). → `FR-02`
- **1.2** Collapse balance-sufficiency to **one** definition. Recommended: keep the projected-balance
  computation in `RentalValidationStore`, and have `RentalStore.isBalanceSufficient`/`customerBalance`
  either delegate to it or be removed and the customer-panel re-pointed (P-A2). → `FR-03`
- **1.3** Replace `RentalValidationStore`'s barrel self-import with relative imports (P-A5). → `FR-03`

### Phase 2 — Import & boundary hygiene
- **2.1** Pick **one** import convention: `@bikerental/shared` for all cross-project imports; restrict
  `@store.*` to *inside* the shared lib (or drop it). Add an ESLint `no-restricted-imports` rule to enforce
  it and prevent regressions (§1.4). → `FR-04`

### Phase 3 — Structure (do after Phase 1 lands)
- **3.1** Move `RentalState`/`RentalDetailState` out of `core/models` into `core/state` beside the store;
  stop exporting them from the domain barrel (P-M4). → `FR-05`
- **3.2** Extract the `RentalStatus`/`EquipmentItemStatus` presentation maps (badge classes + labels) out
  of `rental.model.ts` into a presentation/meta module or pipe (P-M3). → `FR-05`
- **3.3** Remove the dead signal API from `BatchRentalPropertyStore`; extract the shared
  customer+equipment batch-fetch into one helper reused by it and `RentalListStore` (P-A6). → `FR-06`
- **3.4** Consolidate the two rental-summary view-models (`RentalListItem` vs `CustomerRentalSummary`) or
  document the deliberate split; drop the always-zero `estimatedCost` (P-M1). → `FR-06`

### Phase 4 — Lifecycle split (largest; optional, do last)
- **4.1** Split `RentalStore` into a draft/create store and a detail/return store sharing the
  `RENTAL_STORE_TOKEN` contract, so each flow owns only its state (P-A3). Standardize provider scope and
  finish applying the token across all rental sections (P-A4, P-C3). → `FR-07` (proposed, deferred)

### Cross-cutting (fold into whichever phase touches the file)
- Route overdue/"today" through `TimeStore` in `RentalDashboardMapper` and `RentalDashboardComponent` so
  time-travel is consistent with `cost-calculation.mapper.ts` (which already does).
- Replace `operatorId 'FIX_ME'` and the `FALLBACK_* "Call to developer!"` placeholders with explicit,
  non-user-visible handling (track with the auth work, `TASK002`).

### Sequencing rationale
Phase 0 is free correctness. Phase 1 removes the two highest-blast-radius hazards (uncontrolled mutation,
contradictory balance logic) **without** moving files, so it's safe and immediately makes the rental
feature easier to reason about. Phase 2 makes every later move predictable. Phases 3–4 are structural and
benefit from the encapsulation established in Phase 1. Phase 4 is the only step approaching a
"redesign" — deferred until the cheaper wins are banked, and only if the create/detail divergence keeps
causing churn.
