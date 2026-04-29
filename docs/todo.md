# Project TODO

- [ ] Refactor PaymentMethodSelectComponent — use a strictly-typed ControlValueAccessor implementation, ensure disabled-state handling is correct, and update unit tests to avoid any casts.
- [ ] Draw a relationship diagram and reduce the final bundle size by bundling only necessary components.
- [ ] Fix the phone number validator to enforce the international E.164 format (for example: +1234567890)
- [ ] Create a reusable `form-error-messages` component that reads validation state from the nearest `ControlContainer` and displays translated error messages. Add i18n message constants to `src/app/shared/validators/form-error-messages.ts`, ensure messages use `$localize`, and support both reactive and template-driven forms.
- [ ] Create a User store to replace the hardcoded operator: implement a signal-based `UserStore` (providedIn: 'root') that exposes the current user as a `signal()`, methods for login/logout, and optional localStorage persistence; update code to consume this store instead of using a hardcoded operator.
