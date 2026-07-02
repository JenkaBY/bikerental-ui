# Task 006: User Management i18n Labels

> **Applied Skill:** `angular-component` — project rule: all visible text must use `$localize`; never raw string literals in templates or TS. Adds every label consumed by FR-02 through FR-07 up front so no downstream dialog/component task needs to touch `labels.ts` again.

## 1. Objective

Append a `User Management` block of label constants to the existing `Labels` class in `labels.ts`, covering the list view (FR-02), create dialog (FR-03), edit dialog (FR-04), activate/deactivate flow (FR-05), reset-password flow (FR-06), and the temporary-password reveal dialog (FR-07).

## 2. File to Modify

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File — append a new block of `static readonly` members at the end of the existing `export class Labels { ... }` body, immediately before the closing `}`.

## 3. Code Implementation

**Imports Required:** None — file already uses `$localize` and is a plain `class` (not a namespace); follow the exact same `static readonly Name = $localize\`...\`;` member style already used throughout the file.

**Note on existing overlapping labels:** `Labels.Users`, `Labels.Username`, `Labels.Role`, and `Labels.UsersPlaceholderMessage` already exist in this file (added for the placeholder screen). `Labels.Users` stays in use (nav item label). `Labels.UsersPlaceholderMessage` becomes dead code once task-009 replaces the placeholder component — leave it in place (do not delete without an explicit follow-up task; it is unused but harmless and out of scope for this REQ to prune). Do not redeclare `Users`, `Username`, or `Role` below.

**Code to Add:**

* **Location:** Inside `export class Labels { ... }`, append after the last existing member (`static readonly BackToHome = $localize\`Back to home\`;`) and before the closing `}`.

```typescript
  // ── User Management ───────────────────────────────────────────────────────

  static readonly UsersListTitle = $localize`Users`;
  static readonly NewUserButton = $localize`New User`;
  static readonly UsersEmptyState = $localize`No users found`;
  static readonly UsersLoadError = $localize`Failed to load users`;
  static readonly UserColumnUsername = $localize`Username`;
  static readonly UserColumnEmail = $localize`Email`;
  static readonly UserColumnDisplayName = $localize`Display name`;
  static readonly UserColumnRoles = $localize`Roles`;
  static readonly UserColumnStatus = $localize`Status`;
  static readonly UserColumnLastLogin = $localize`Last login`;
  static readonly UserColumnActions = $localize`Actions`;
  static readonly UserStatusActive = $localize`Active`;
  static readonly UserStatusDisabled = $localize`Disabled`;
  static readonly UserLastLoginNever = $localize`Never`;
  static readonly UserEditTooltip = $localize`Edit`;
  static readonly UserResetPasswordTooltip = $localize`Reset password`;
  static readonly UserActivateTooltip = $localize`Activate`;
  static readonly UserDeactivateTooltip = $localize`Deactivate`;

  static readonly CreateUserDialogTitle = $localize`New User`;
  static readonly UserUsernameLabel = $localize`Username`;
  static readonly UserEmailLabel = $localize`Email`;
  static readonly UserDisplayNameLabel = $localize`Display name`;
  static readonly UserRolesLabel = $localize`Roles`;
  static readonly UserPasswordLabel = $localize`Password (optional)`;
  static readonly UserPasswordHint = $localize`Leave blank to auto-generate a temporary password`;
  static readonly CreateUserConfirmButton = $localize`Create`;
  static readonly CreateUserSuccessNoReveal = $localize`User created successfully`;
  static readonly CreateUserError = $localize`Failed to create user`;

  static readonly EditUserDialogTitle = $localize`Edit User`;
  static readonly UserStatusLabel = $localize`Status`;
  static readonly SaveUserButton = $localize`Save`;
  static readonly EditUserError = $localize`Failed to update user`;

  static readonly DeactivateUserDialogTitle = $localize`Deactivate user`;
  static readonly DeactivateUserDialogMessage = $localize`This will disable the account and revoke all of its active sessions. The user will no longer be able to sign in until reactivated.`;
  static readonly DeactivateUserConfirmButton = $localize`Deactivate`;
  static readonly DeactivateUserError = $localize`Failed to deactivate user`;
  static readonly ActivateUserError = $localize`Failed to activate user`;

  static readonly ResetPasswordDialogTitle = $localize`Reset password`;
  static readonly ResetPasswordDialogMessage = $localize`This will issue a new temporary password, force the user to change it at next login, and revoke all of their active sessions.`;
  static readonly ResetPasswordConfirmButton = $localize`Reset password`;
  static readonly ResetPasswordError = $localize`Failed to reset password`;

  static readonly TemporaryPasswordDialogTitle = $localize`Temporary password`;
  static readonly TemporaryPasswordWarning = $localize`This password is shown only once and cannot be retrieved again. Copy it now and share it securely with the user.`;
  static readonly TemporaryPasswordCopyButton = $localize`Copy`;
  static readonly TemporaryPasswordCopiedConfirmation = $localize`Copied to clipboard`;
  static readonly TemporaryPasswordCopyFailed = $localize`Copy failed — select and copy the password manually`;
  static readonly TemporaryPasswordDoneButton = $localize`Done`;
```

## 4. Validation Steps

```bash
npm run i18n:extract
```

Confirm no `$localize` compilation errors appear. The command updates `projects/shared/src/locale/messages.xlf` with the new message IDs.
