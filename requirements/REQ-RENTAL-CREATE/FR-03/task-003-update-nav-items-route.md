# Task 003: Update `NAV_ITEMS` Route in Both Layout Components

> **Applied Skill:** `angular-component` — Dumb layout components hold the navigation constants. The `route` value in the `NAV_ITEMS` array for the "New Rental" item must be updated in both the mobile layout and the desktop shell wrapper to match the renamed route.

## 1. Objective

Update the `route` property of the "New Rental" `NavItem` from `'rental/new'` to `'rentals/new'` in the `NAV_ITEMS` constant defined in both `OperatorLayoutComponent` (mobile path) and `OperatorShellWrapperComponent` (desktop path). This ensures tapping the bottom nav item or clicking the sidebar link navigates to the correct route.

## 2. Files to Modify

### File A

* **File Path:** `projects/operator/src/app/layout/operator-layout.component.ts`
* **Action:** Modify Existing File

### File B

* **File Path:** `projects/operator/src/app/layout/operator-shell-wrapper.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Change in `operator-layout.component.ts`

**Imports Required:** None — no new imports needed.

**Code to Add/Replace:**

* **Location:** Inside the top-level `NAV_ITEMS` constant (before the `@Component` decorator), find the entry where `icon: 'add_circle'` and update its `route` property.
* **Snippet:**

Replace:

```typescript
  { label: $localize`New Rental`, route: 'rental/new', icon: 'add_circle' },
```

With:

```typescript
  { label: $localize`New Rental`, route: 'rentals/new', icon: 'add_circle' },
```

### Change in `operator-shell-wrapper.component.ts`

**Imports Required:** None — no new imports needed.

**Code to Add/Replace:**

* **Location:** Inside the top-level `NAV_ITEMS` constant (before the `@Component` decorator), find the entry where `icon: 'add_circle'` and update its `route` property.
* **Snippet:**

Replace:

```typescript
  { label: $localize`New Rental`, route: 'rental/new', icon: 'add_circle' },
```

With:

```typescript
  { label: $localize`New Rental`, route: 'rentals/new', icon: 'add_circle' },
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng test operator --include="**/layout/**"
```
