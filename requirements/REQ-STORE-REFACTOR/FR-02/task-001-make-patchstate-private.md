# Task 001: Make `patchState` Private

> **Applied Skill:** `angular-signals` — Private writable state principle: internal signal mutators must not be accessible outside the owning class.

## 1. Objective

Add the `private` access modifier to the `patchState` method in `RentalStore` so that TypeScript enforces that no code outside `rental.store.ts` can call it directly.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.store.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

No new imports needed.

**Code to Add/Replace:**

* **Location:** Line 49 of `rental.store.ts` — the `patchState` method declaration immediately below the `_state` signal initializer block.

Replace this exact snippet:

```typescript
  patchState(partial: Partial<ReturnType<typeof this._state>>) {
    this._state.update((s) => ({ ...s, ...partial }));
  }
```

With:

```typescript
  private patchState(partial: Partial<ReturnType<typeof this._state>>) {
    this._state.update((s) => ({ ...s, ...partial }));
  }
```

The only change is the addition of the `private` keyword at the start of the method declaration. The signature type, parameter name, and body are identical to what is already there.

## 4. Validation Steps

Run the TypeScript compiler check first to confirm the modifier compiles cleanly and no external file references the now-private method:

```bash
npm run build
```

The build must produce zero errors. Because no file outside `rental.store.ts` currently calls `patchState` (confirmed by codebase-wide grep), the build will succeed without any additional changes.
