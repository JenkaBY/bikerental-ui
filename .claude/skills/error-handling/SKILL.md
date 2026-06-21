---
name: error-handling
description: Handle backend API errors in this Angular app — parse RFC 7807 ProblemDetail into a typed ApiError, resolve localized messages by error code, show toasts via NotificationService, and bind server validation errors to reactive forms. Use when integrating an API call, writing store/service error paths, displaying failures, showing form validation from the server, or adding a new backend error code. Triggers on catchError, HttpErrorResponse, snackbar/toast on error, "something went wrong", and form server-side validation.
---

# API Error Handling

All backend errors are RFC 7807 `ProblemDetail` bodies with a stable code in `properties.code`
(e.g. `finance.insufficient_balance`, `rental.equipment.not_available`). The toolkit lives in
`projects/shared/src/core/errors/` and is exported from `@bikerental/shared`.

## The pieces

| Symbol | Use |
|--------|-----|
| `ApiError` | typed error: `{ code, kind, status, detail, fieldErrors[], params, traceId, raw }` |
| `ApiErrorParser.parse(err)` | `HttpErrorResponse` (or anything) → `ApiError`; tolerant of network/HTML/non-ProblemDetail bodies |
| `ErrorMessages` / `ErrorMessageCatalog` | all localized message templates (in single file; catalog used for dynamic lookups by code) |
| `ErrorMessageResolver.resolve(apiError)` | `ApiError` → localized string (`code → status → generic` fallback) |
| `NotificationService` | snackbar wrapper: `success/info/warn/error(message)` |
| `applyServerErrors(form, apiError)` | sets `server` error on matching controls; returns unmatched messages |
| `SUPPRESS_ERROR_NOTIFICATION` / `suppressErrorNotification()` | per-request opt-out of the global toast |

The global `errorInterceptor` already parses every failed request, records `ApiError` on
`ErrorService.lastError`, and toasts via `NotificationService` unless the request opted out.

## Recipe: domain error in a store/component

When you handle an error locally, **suppress the global toast** and show your own contextual message:

```ts
private readonly notifications = inject(NotificationService);
private readonly resolver = inject(ErrorMessageResolver);

activate(): void {
  this.store.activateRental().pipe(
    tap(() => this.notifications.success(Labels.RentalStarted)),
    catchError((err) => {
      const apiError = ApiErrorParser.parse(err);
      this.notifications.error(this.resolver.resolve(apiError));
      return EMPTY;
    }),
    takeUntilDestroyed(this.destroyRef),
  ).subscribe();
}
```

To stop the interceptor from also toasting, send the request with the suppress context (the
generated services accept `RequestOptions` with a `context`):

```ts
this.service.activateRental(id, { context: suppressErrorNotification() });
```

## Recipe: server validation errors on a form

```ts
save(): void {
  clearServerErrors(this.form);
  this.store.create(write).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
    next: () => this.dialogRef.close(true),
    error: (err) => {
      const apiError = ApiErrorParser.parse(err);
      const summary = applyServerErrors(this.form, apiError); // binds field errors
      if (summary.length) this.notifications.error(summary.join(' '));
    },
  });
}
```

Template — render the server error alongside existing client-side ones:

```html
@if (form.controls.name.hasError('server')) {
  <mat-error>{{ form.controls.name.getError('server') }}</mat-error>
}
```

## Adding a NEW backend error code

1. Add the constant to `core/errors/error-code.ts` (mirror the backend `ErrorCodes`), and to
   `isValidationCode`/`isDomainCode` if it should be classified.
2. Add a `$localize` message to `core/errors/error-message.catalog.ts`. For dynamic values use a
   function template that interpolates `params`:
   ```ts
   [ErrorCode.INSUFFICIENT_BALANCE]: (p) =>
     $localize`Insufficient balance. Short by ${p['amount'] as number}:amount:.`,
   ```
3. Run `npm run i18n:extract`.

Until a code has a catalog entry, the resolver falls back to a per-status generic — safe, but add
real copy.

The enforced rules (what not to do, what must be registered, etc.) live in `AGENTS.md` → *API Error Handling*.
