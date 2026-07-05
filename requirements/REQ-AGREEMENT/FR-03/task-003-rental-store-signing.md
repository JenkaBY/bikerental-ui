# Task 003: RentalStore — version/isAwaitingSignature computeds + sendToSigning/cancelSigning

> **Applied Skills:** `angular-signals` (new computeds derived from `_state`, new busy-flag signal
> pattern matching `isActivating`/`isReturning`), `error-handling` (`sendToSigning`/`cancelSigning`
> pass `{ context: suppressErrorNotification() }` exactly like `addEquipmentToRental`, because the
> signing flow orchestrator resolves 409s itself and must not double-toast) — implements FR-03
> design section 3, bullet 3.

## 1. Objective

Add `version`, `isAwaitingSignature`, `isSendingToSigning` computeds and `sendToSigning()` /
`cancelSigning()` methods to `RentalStore`, mirroring the existing `activateRental()` /
`cancelRental()` patterns but targeting the new `AWAITING_SIGNATURE` / `DRAFT` lifecycle statuses
and patching `{status, version}` from the lifecycle response.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — `suppressErrorNotification` is already imported; `map`/`finalize` are
already imported from `rxjs/operators`.

**Code to Add/Replace:**

### 3.1 New state field in the `_state` initializer

* **Location:** Inside the `signal<RentalDetailState>({...})` initializer, immediately after
  `status: '',`.
* **Snippet:**

```typescript
    status: '',
    version: null,
    customerId: '',
```

### 3.2 New computeds

* **Location:** Immediately after the existing line
  `readonly isDraft = computed(() => this._state().status === 'DRAFT');`.
* **Snippet:**

```typescript
  readonly isDraft = computed(() => this._state().status === 'DRAFT');
  readonly isAwaitingSignature = computed(
    () => this._state().status === 'AWAITING_SIGNATURE',
  );
  readonly version = computed(() => this._state().version);
  readonly isSendingToSigning = computed(() => this._state().isSendingToSigning);
```

### 3.3 New busy flag in `RentalDetailState` usage — NOTE

`isSendingToSigning` is NOT part of `RentalDetailState` (that interface is reserved for
server-mirrored fields per `rental.state.ts`); it is a store-local UI flag. Add it as a sibling
signal, not inside `_state`:

* **Location:** Immediately after the line `readonly loadError = signal(false);`.
* **Snippet:**

```typescript
  readonly loadError = signal(false);
  private readonly _isSendingToSigning = signal(false);
```

Then replace the computed added in 3.2 to read the private signal instead of `_state()`:

```typescript
  readonly isSendingToSigning = computed(() => this._isSendingToSigning());
```

### 3.4 `sendToSigning()` and `cancelSigning()` methods

* **Location:** Immediately after the existing `cancelRental()` method (right before `loadDetail`).
* **Snippet:**

```typescript
  sendToSigning(): Observable<number> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    this._isSendingToSigning.set(true);
    return this.rentalsService
      .updateLifecycle(
        id,
        { status: 'AWAITING_SIGNATURE', operatorId: this.operatorId() },
        undefined,
        { context: suppressErrorNotification() },
      )
      .pipe(
        tap((r) => this.patchState({ status: r.status, version: r.version })),
        map((r) => r.version),
        finalize(() => this._isSendingToSigning.set(false)),
      );
  }

  cancelSigning(): Observable<void> {
    const id = this._state().id;
    if (id === null) throw new Error('No rental id in store');
    return this.rentalsService
      .updateLifecycle(id, { status: 'DRAFT', operatorId: this.operatorId() }, undefined, {
        context: suppressErrorNotification(),
      })
      .pipe(
        tap((r) => this.patchState({ status: r.status, version: r.version })),
        map(() => undefined as void),
      );
  }
```

**Note on `reset()`:** leave `reset()` untouched — it does not need to clear `version` because
`loadDetail`/`sendToSigning`/`cancelSigning` always overwrite it from the latest server response,
consistent with how `status`/`customerId` are already left out of `reset()`'s patch.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
