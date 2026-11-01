# Task 008: PointMovementsStore "show more" (accumulating) mode

> **Applied Skill:** `angular-signals` - extra `computed` (`hasMore`) and config flag, no new component state. CLAUDE.md / memory rule "UI state in stores" - the accumulated rows and the "is there more" decision live in the store, not in the tab. Design FR-03 section 4 - the period is date-granular, rows recorded before `notBefore` sort last when newest-first, so the list pages with "Show more" and stops once a row older than `notBefore` has been loaded.

## 1. Objective

Extend `PointMovementsStore` (existing consumers keep their behaviour) with an opt-in
`accumulate: true` config: `loadMore()` appends the next page, `hasMore` tells the tab whether to
render "Show more", and `reload()` restarts from page 0 so a refresh never leaves a half-loaded
list. A failed append keeps the loaded rows, steps `pageIndex` back and does not set `failed`
(the interceptor already notified).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/point-movements.store.ts` - **Action:** Modify Existing File

## 3. Code Implementation

Apply the following edits in order (each "find" text exists exactly once).

**Edit 1** - config. Find:

```typescript
  readonly notBefore?: Date | null;
}
```

Replace with:

```typescript
  readonly notBefore?: Date | null;
  readonly accumulate?: boolean;
}
```

**Edit 2** - derived state. Find:

```typescript
  readonly rows = computed<readonly PointMovementRow[]>(() => {
```

Insert directly above it:

```typescript
  readonly hasMore = computed(() => {
    const config = this._config();
    if (!config?.accumulate || this._failed()) return false;
    if (this._items().length >= this._total()) return false;
    const notBefore = config.notBefore ?? null;
    if (!notBefore || config.order !== 'newest') return true;
    return !this._items().some((movement) => movement.recordedAt.getTime() < notBefore.getTime());
  });
```

**Edit 3** - public methods. Find:

```typescript
  reload(): void {
    this.fetch(this._pageIndex());
  }
```

Replace with:

```typescript
  loadMore(): void {
    if (this.hasMore() && !this._loading()) this.fetch(this._pageIndex() + 1, true);
  }

  reload(): void {
    this.fetch(this._config()?.accumulate ? 0 : this._pageIndex());
  }
```

**Edit 4** - fetch signature. Find:

```typescript
  private fetch(pageIndex: number): void {
    const config = this._config();
    if (!config || PointPeriodRule.validate(config.period.from, config.period.to) !== null) return;
    this.subscription?.unsubscribe();
    this._pageIndex.set(pageIndex);
```

Replace with:

```typescript
  private fetch(pageIndex: number, append = false): void {
    const config = this._config();
    if (!config || PointPeriodRule.validate(config.period.from, config.period.to) !== null) return;
    this.subscription?.unsubscribe();
    const previousPageIndex = this._pageIndex();
    this._pageIndex.set(pageIndex);
```

**Edit 5** - subscribe handlers. Find:

```typescript
        next: (page) => {
          this._items.set(page.items);
          this._total.set(page.totalItems);
        },
        error: (err: unknown) => {
          this.ledgerNotifier.notify(err);
          this._items.set([]);
          this._total.set(0);
          this._failed.set(true);
        },
```

Replace with:

```typescript
        next: (page) => {
          this._items.set(append ? [...this._items(), ...page.items] : page.items);
          this._total.set(page.totalItems);
        },
        error: (err: unknown) => {
          this.ledgerNotifier.notify(err);
          if (append) {
            this._pageIndex.set(previousPageIndex);
            return;
          }
          this._items.set([]);
          this._total.set(0);
          this._failed.set(true);
        },
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/state/point-movements.store.ts
npx ng build admin --configuration development
npx ng lint shared
```
