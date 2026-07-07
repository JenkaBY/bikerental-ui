---
name: angular-rxjs-streams
description: Keep RxJS chains flat, cancellable, and lifecycle-safe in this Angular app. RxJS only shows up at boundaries here (signals own component state) — MatDialog.afterClosed(), HttpClient/generated API services, router events, signing-flow observables. Use when writing or reviewing .pipe()/.subscribe() chains, dialog-confirm-then-request flows, multi-step wizard steps, or anything wrapped in takeUntilDestroyed(). Triggers on switchMap, concatMap, mergeMap, exhaustMap, catchError, nested subscribe, or "pyramid of doom".
---

# RxJS: Flat, Cancellable, Lifecycle-Safe Streams

`signal()`/`computed()` own component state (see `angular-signals`). RxJS only appears at
boundaries — `MatDialog.afterClosed()`, `HttpClient`/generated API services, router events,
`signingFlow`-style observables. Keep those chains flat.

## Anti-patterns to reject on sight

- **Nested subscribe** — a `.subscribe()` callback that calls another `.subscribe()`. Almost
  always means the second call belongs in the pipe as `switchMap`/`concatMap`/`exhaustMap`.
- **Nested pipe** — `switchMap(x => service.call().pipe(...))`. Flatten into the outer pipe.
- **`of(null)`/`of(undefined)` in `catchError`** — poisons every downstream operator with an
  `if (val === null)` check. Return `EMPTY` instead (pairs with the `error-handling` skill's
  `ApiErrorParser` + `NotificationService` recipe).
- **`takeUntilDestroyed()` racing a navigation/state change that destroys the host** — make sure
  the chain completes (or the dialog closes) before anything unmounts the component.

## Refactor recipe

1. **Flatten**: one linear pipe instead of a nested tree; carry state forward with
   `map(x => ({ ...context, x }))` objects instead of closures.
2. **Early exit**: `filter()` (or a type-guard predicate) instead of an `if`/`return` inside the
   higher-order operator.
3. **Pick the right flattening operator**:
  - `switchMap` — cancellable reads (search, resource refetch).
  - `concatMap` — ordered writes that must not drop (sequential saves).
  - `exhaustMap` — confirm-dialog → request chains and submit buttons; ignores re-fires while
    in flight (no manual disable-button needed).
4. **No inline step comments** — this repo's convention is self-documenting code (`AGENTS.md` →
   "No code comments"). A flat pipe with well-named operators/variables should already read
   top-to-bottom; don't add a `// 1. …` narration instead.

## Example (from this codebase)

Before — nested subscribe, raw `snackBar.open` instead of the `error-handling` skill's
`NotificationService`/`ApiErrorParser`:

```ts
protected
onCancel()
:
void {
  this.dialog.open(CancelRentalDialogComponent, { disableClose: false })
    .afterClosed()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe((confirmed) => {
      if (!confirmed) return;
      this.store.cancelRental().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.snackBar.open(...);
          this.router.navigate(['/rentals']);
        },
        error: () => {
          this.snackBar.open(...);
        },
      });
    });
}
```

After — flat, `exhaustMap` (the dialog only ever confirms once, and it guards a double-click
too), errors routed through the project's error toolkit:

```ts
protected
onCancel()
:
void {
  this.dialog.open(CancelRentalDialogComponent, { disableClose: false })
    .afterClosed()
    .pipe(
      filter((confirmed): confirmed is true => !!confirmed),
      exhaustMap(() => this.store.cancelRental().pipe(
        tap(() => {
          this.notifications.success(Labels.RentalCancelSuccess);
          this.router.navigate(['/rentals']);
        }),
        catchError((err) => {
          this.notifications.error(this.resolver.resolve(ApiErrorParser.parse(err)));
          return EMPTY;
        }),
      )),
      takeUntilDestroyed(this.destroyRef),
    )
    .subscribe();
}
```

## When reviewing or generating code

Point out exactly where a chain bends into a pyramid or risks a lifecycle race — briefly, like a
peer, not a lecture — then apply the recipe above.
