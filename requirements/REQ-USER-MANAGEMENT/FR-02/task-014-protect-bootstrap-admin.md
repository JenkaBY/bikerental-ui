# Task 014: Protect Bootstrap Admin Account From Modification

> **Applied Skills:** `angular-signals` (pure predicate methods, no new state), `angular-component`
> (template `[disabled]`/`[matTooltip]` bindings) — extends FR-02's self-lockout gating with a second,
> independent lock so the bootstrapped super-user account (`username: 'admin'`) can never be edited,
> deactivated, reset, or re-roled from this screen by any admin, including admins other than itself.

## 1. Objective

Add a `username`-based protection rule alongside the existing `id`-based self-lockout rule in
`UsersListComponent`. The row whose `username` is exactly `admin` must have its edit, reset-password,
and activate/deactivate controls disabled for every viewer, with a tooltip explaining the account is
protected. This account may only change its own credentials through the existing self-service
"Change Password" flow, not through this admin screen.

## 2. Files Modified

* **File Path:** `projects/admin/src/app/users/users-list.component.ts`
  * **Action:** Modify Existing File — added `bootstrapAdminUsername`, `isBootstrapAdmin(row)`,
    `isRowLocked(row)`; replaced all three `[disabled]="isOwnAccount(row)"` bindings with
    `[disabled]="isRowLocked(row)"`; tooltips now show `Labels.UserProtectedTooltip` when
    `isBootstrapAdmin(row)` is true.
* **File Path:** `projects/shared/src/shared/constant/labels.ts`
  * **Action:** Modify Existing File — added `UserProtectedTooltip`.

## 3. Code Implementation

**`users-list.component.ts` — new predicates (added next to `isOwnAccount`):**

```typescript
private readonly bootstrapAdminUsername = 'admin';

isOwnAccount(row: ManagedUser): boolean {
  return row.id === this.currentUserId();
}

isBootstrapAdmin(row: ManagedUser): boolean {
  return row.username === this.bootstrapAdminUsername;
}

isRowLocked(row: ManagedUser): boolean {
  return this.isOwnAccount(row) || this.isBootstrapAdmin(row);
}
```

**Template — actions column, each button's `[disabled]` switched from `isOwnAccount(row)` to
`isRowLocked(row)`, and `[matTooltip]` branches to `Labels.UserProtectedTooltip` when
`isBootstrapAdmin(row)` is true** (see current file content for the exact template).

**`labels.ts` — new label, added next to `UserDeactivateTooltip`:**

```typescript
static readonly UserProtectedTooltip = $localize`This is a protected system account and cannot be modified here`;
```

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/admin/tsconfig.app.json
npm run fix
```

Both passed clean — no errors, no formatting changes needed beyond the edits above.
