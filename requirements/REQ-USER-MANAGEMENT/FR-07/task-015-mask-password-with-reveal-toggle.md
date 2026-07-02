# Task 015: Mask Temporary Password With Show/Hide Toggle

> **Applied Skills:** `angular-signals` (local `showPassword` toggle signal), `angular-component`
> (template `[type]`/`[attr.aria-label]` bindings) — hardens `TemporaryPasswordDialogComponent`
> against accidental exposure in screen shares/screenshots by masking the password by default.

## 1. Objective

The temporary-password reveal field previously rendered as a plain, always-visible text input.
Change it to a masked (`type="password"`) field by default, with a "show password" toggle button
(eye icon) that reveals the plaintext value on demand and can re-mask it. The copy-to-clipboard
action is unaffected and works regardless of the masked/revealed state.

## 2. Files Modified

* **File Path:**
  `projects/shared/src/shared/components/temporary-password-dialog/temporary-password-dialog.component.ts`
  * **Action:** Modify Existing File — added `showPassword` signal and `toggleShowPassword()`
    method; input's `type` bound to `showPassword() ? 'text' : 'password'`; added a `matSuffix`
    toggle button (`visibility`/`visibility_off` icons) before the existing copy button.
* **File Path:** `projects/shared/src/shared/constant/labels.ts`
  * **Action:** Modify Existing File — added `TemporaryPasswordShowButton`,
    `TemporaryPasswordHideButton`.

## 3. Code Implementation

**`temporary-password-dialog.component.ts` — input and new toggle button:**

```html
<input
  matInput
  [type]="showPassword() ? 'text' : 'password'"
  [value]="data.temporaryPassword"
  readonly
  (focus)="selectAll($event)"
  #passwordInput
/>
<button
  mat-icon-button
  matSuffix
  type="button"
  [attr.aria-label]="
    showPassword() ? Labels.TemporaryPasswordHideButton : Labels.TemporaryPasswordShowButton
  "
  (click)="toggleShowPassword()"
>
  <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
</button>
```

**Component class — new signal and method (added next to `copyState`):**

```typescript
protected readonly showPassword = signal(false);

toggleShowPassword(): void {
  this.showPassword.update((shown) => !shown);
}
```

**`labels.ts` — new labels, added next to `TemporaryPasswordDoneButton`:**

```typescript
static readonly TemporaryPasswordShowButton = $localize`Show password`;
static readonly TemporaryPasswordHideButton = $localize`Hide password`;
```

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npm run fix
```

Both passed clean.
