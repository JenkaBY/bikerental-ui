# System Design: FR-03 - Single Source of Truth for Balance Sufficiency

## 1. Architectural Overview

Today two state components answer "can this customer afford this rental?" with different
semantics. The rental aggregate store exposes a `isBalanceSufficient` that only asks "is the
wallet non-negative?" (`available >= 0`, cost ignored), while the rental-validation store exposes a
`isBalanceSufficient` derived from the *projected* balance (`available - totalCost >= 0`). The
customer panel binds its red/green colour to the first definition; the cost footer and the step-3
proceed/activate controls bind their enabled state to the second. The two can therefore visibly
disagree on the same screen.

This story collapses the two answers into one. The projected-balance computation in the
rental-validation store becomes the single source of truth, and the rental aggregate store's
`isBalanceSufficient` is re-expressed as a delegation to it so the existing store contract
(`RENTAL_STORE_TOKEN`) is preserved and every consumer of that contract — including the customer
panel — automatically reflects the projected answer. No component contract is added or removed; the
topology is unchanged. The only observable behaviour change is that the customer panel now turns red
exactly when the proceed/activate control is disabled. A secondary clean-up gives `customerBalance`
a single owner (the customer-finance store), drops a dead cached copy from the rental-detail state
shape, and removes a barrel self-import inside the shared library to eliminate a module
cyclic-initialisation hazard.

## 2. Impacted Components

* **`RentalValidationStore` (Rental Validation Store):** Confirmed as the *sole authority* for
  projected-balance sufficiency. No semantic change to its computation
  (`projectedBalance = available - totalCost`; `isBalanceSufficient = projectedBalance >= 0`). It
  must stop importing its sibling dependencies (cost-calculation store, customer-finance store,
  rental aggregate store, money factory) through the shared library's own public barrel and instead
  import them via relative module paths, removing the self-referential import that risks
  cyclic module initialisation when the library bootstraps.
* **`RentalStore` (Rental Aggregate Store):** Its `isBalanceSufficient` stops computing
  `available >= 0` and instead **delegates** to the rental-validation store's projected-sufficiency
  answer, keeping the same boolean signal name and the `RENTAL_STORE_TOKEN` shape intact. Because
  the rental-validation store depends on the rental aggregate store (directly and transitively via
  the cost store), the delegation must use **deferred, optional resolution** of the validation
  store rather than eager construction-time injection — see Section 6 (Scale & Performance) for the
  cycle-avoidance rule and the detail-screen fallback. Its `customerBalance` signal remains a thin,
  un-cached pass-through to the customer-finance store's balance.
* **`CustomerFinanceStore` (Customer Finance Store):** Becomes the single declared owner of the
  customer balance. No code change to the store itself; its `balance` signal is documented as the
  one authoritative balance source that all other stores and panels read through.
* **`RentalDetailState` (Rental Detail State shape):** The optional `customerBalance` attribute is
  removed. It is never populated by the rental-dashboard mapper and never read (the aggregate
  store's `customerBalance` signal reads the finance store directly), so it is a dead second copy.
  If retained for any reason it must be explicitly annotated display-only and excluded from
  sufficiency logic.
* **`RentalCustomerPanelComponent` (Customer Panel):** No code change required under the preferred
  approach. By binding to `store.isBalanceSufficient()` through `RENTAL_STORE_TOKEN` it transparently
  inherits the projected-sufficiency answer once the aggregate store delegates. Its colour now
  matches the footer/step-3 control state by construction.

## 3. Abstract Data Schema Changes

No persisted/backend schema changes. All affected state is in-memory, derived UI state.

* **Entity: `RentalDetailState` (in-memory rental aggregate state)**
  * **Attributes Removed:** `customerBalance` (optional Money). It is a dead duplicate of the
    authoritative customer-finance balance; removing it enforces single ownership.
* **Entity: `Customer Balance` (in-memory, owned by Customer Finance Store)**
  * **Attributes Added/Modified:** none. Confirmed as the single owner of `available`, `reserved`,
    `isWithdrawalAvailable`, and `lastUpdatedAt`.
* **Relations:**
  * The rental aggregate state no longer holds its own balance copy; the relationship "rental ->
    customer balance" is now expressed only as a read-through reference from the aggregate store's
    `customerBalance` signal to the customer-finance store's `balance` signal.
  * Projected sufficiency is a derived relation: `projectedBalance = financeBalance.available -
    costEstimate.totalCost`, owned exclusively by the rental-validation store.

## 4. Component Contracts & Payloads

No inter-service (HTTP/event) contract changes. All affected contracts are intra-process signal
contracts within the shared state layer.

* **Contract: `RENTAL_STORE_TOKEN` (Rental Store Contract)**
  * **Protocol:** In-process injection token / readonly signal interface.
  * **Payload Changes:** Shape unchanged — `customer`, `customerBalance`, `isBalanceSufficient`,
    plus the pricing/special-price members. The **meaning** of `isBalanceSufficient` changes from
    "wallet non-negative" to "projected balance after rental cost is non-negative." Consumers bound
    to this token (customer panel, and any detail-screen consumers) require no edits.
* **Interaction: `RentalStore` -> `RentalValidationStore`**
  * **Protocol:** In-process deferred/optional dependency resolution + signal read.
  * **Payload Changes:** `RentalStore.isBalanceSufficient` reads
    `RentalValidationStore.isBalanceSufficient()` when that store is available in the current
    injection scope; when it is absent (e.g. the rental-detail screen, which provides the aggregate
    store but not the validation/cost stores), it falls back to the legacy
    `available >= 0` answer so the detail screen keeps its current behaviour.
* **Interaction: `RentalValidationStore` -> {`CustomerFinanceStore`, `RentalCostCalculationStore`,
  `RentalStore`, money factory}**
  * **Protocol:** In-process dependency injection / module import.
  * **Payload Changes:** No runtime payload change. Import resolution moves from the library's
    public barrel to relative sibling module paths, removing the self-import edge from the
    library's internal module graph.

## 5. Updated Interaction Sequence

### Happy path — rental-create screen (validation store present)

1. Operator selects a customer in step 1; the aggregate store sets the customer and triggers the
   customer-finance store to load the balance for that customer id.
2. Operator selects equipment / duration in step 2; the cost-calculation store derives a request
   from aggregate state and produces a `totalCost` estimate.
3. The rental-validation store computes `projectedBalance = financeBalance.available - totalCost`
   and `isBalanceSufficient = projectedBalance >= 0`.
4. The cost footer binds the proceed button's enabled state and its projected-balance colour to the
   validation store's `canProceed()` / `isBalanceSufficient()`.
5. The customer panel binds its balance colour to `RENTAL_STORE_TOKEN.isBalanceSufficient()`, which
   the aggregate store has delegated to the validation store — so the panel colour and the footer
   button now derive from the **same** boolean.
6. Step 3 binds the activate button's enabled state and the balance-warning block to the same
   validation-store signal.

### Unhappy path — insufficient projected balance (Scenario 1)

1. `available = 100`, `totalCost = 150` -> `projectedBalance = -50`.
2. Validation store: `isBalanceSufficient = false`.
3. Aggregate store delegates the same `false` to the customer panel.
4. Result: customer panel shows the warning colour AND the proceed/activate control is disabled AND
   the insufficient-balance / shortfall block renders — all consistent.

### Sufficient projected balance (Scenario 2)

1. `available = 200`, `totalCost = 150` -> `projectedBalance = 50`.
2. Validation store: `isBalanceSufficient = true`.
3. Panel shows the positive colour AND the proceed/activate control is enabled.

### Fallback path — rental-detail screen (validation store absent)

1. The detail screen provides the aggregate store and customer-finance store, but not the
   validation or cost stores.
2. The aggregate store's `isBalanceSufficient` cannot resolve a validation store, so it falls back
   to the legacy `available >= 0` answer.
3. The customer panel renders unchanged from today's detail-screen behaviour — no regression.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No change. Balance values are read-only UI derivations; no new data crosses a
  trust boundary, and balance figures are not logged (only event/IDs are, per existing logging
  rules).
* **Scale & Performance:** All sufficiency logic remains pure `computed` signal derivation with no
  added I/O or backend calls — performance is unchanged.
  * **Cyclic-dependency avoidance (load-bearing decision):** The validation store already depends on
    the aggregate store (directly, and transitively through the cost-calculation store). Having the
    aggregate store delegate back to the validation store therefore closes a dependency loop. To
    keep the preferred Option (a) without a runtime DI cycle, the aggregate store must resolve the
    validation store **lazily and optionally** (deferred resolution evaluated inside the `computed`,
    optional so a missing provider yields a fallback) rather than via eager construction-time
    injection. This also makes the delegation tolerant of injection scopes that provide the
    aggregate store but not the validation store (the detail screen).
  * **Tradeoff vs. Option (b) (re-point the panel directly at the validation store):** Option (b)
    avoids the loop entirely and is structurally simpler, but it breaks the `RENTAL_STORE_TOKEN`
    abstraction — the panel would then need both the token and the concrete validation store
    injected, and every future consumer of "sufficiency" would have to know which store to read.
    Option (a) keeps one contract (`RENTAL_STORE_TOKEN.isBalanceSufficient`) as the single read
    surface for all consumers, at the cost of the deferred/optional-resolution mechanism described
    above. Option (a) is chosen; Option (b) is the documented fallback only if the
    deferred-resolution approach proves unworkable in a given injection scope.
  * **Module-init safety:** Routing the validation store's sibling imports through relative paths
    instead of the library's own public barrel removes a self-referential edge in the library's
    module graph, eliminating a class of cyclic module-initialisation failures (symbols observed as
    `undefined` at construction time depending on evaluation order).
  * **Concurrency:** Signal recomputation is synchronous and idempotent; no rate-limiting, queuing,
    or caching is introduced. Removing the dead `customerBalance` copy from the detail state removes
    a stale-state hazard rather than adding one.
