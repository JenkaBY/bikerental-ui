# Task 005: Wire New Model/Mapper/Store into Shared Barrels

> **Applied Skill:** `angular-di` — ensures `Role`, `ASSIGNABLE_ROLES`, `ROLE_LABELS`, `ManagedUser*`, `UserCreationResult`, `ManagedUserMapper`, and `ManagedUserStore` are all discoverable from `@bikerental/shared` before any consuming component/dialog code is written in later tasks.

## 1. Objective

Add the new `role.model.ts` and `managed-user.model.ts` exports to `core/models/index.ts`, add `managed-user.mapper.ts` to `core/mappers/index.ts`, and add a direct `core/state/managed-user.store.ts` export line to `public-api.ts` (this codebase has no `core/state/index.ts` barrel — `public-api.ts` re-exports each state file individually).

## 2. Files to Modify

### File 1: `projects/shared/src/core/models/index.ts`

* **Action:** Modify Existing File
* **Location:** Append after the last existing export line.

**Current file (relevant tail):**

```typescript
export * from './rental-create.model';
export * from './rental-dashboard.model';
```

**New lines to append:**

```typescript
export * from './role.model';
export * from './managed-user.model';
```

---

### File 2: `projects/shared/src/core/mappers/index.ts`

* **Action:** Modify Existing File
* **Location:** Append after the last existing export line.

**Current file (relevant tail):**

```typescript
export * from './equipment-search-item.mapper';
export * from './rental-dashboard.mapper';
```

**New line to append:**

```typescript
export * from './managed-user.mapper';
```

---

### File 3: `projects/shared/src/public-api.ts`

* **Action:** Modify Existing File
* **Location:** In the `// Core — signal state stores` block, add the new store export immediately after the existing `export * from './core/state/user.store';` line.

**Current lines (context):**

```typescript
export * from './core/state/rental-validation.store';
export * from './core/state/user.store';
export * from './core/state/time-travel.store';
```

**New code (insert `managed-user.store` line directly after `user.store`):**

```typescript
export * from './core/state/rental-validation.store';
export * from './core/state/user.store';
export * from './core/state/managed-user.store';
export * from './core/state/time-travel.store';
```

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npm run build -- --project shared
```

Confirm `Role`, `ASSIGNABLE_ROLES`, `ROLE_LABELS`, `ManagedUser`, `ManagedUserCreateWrite`, `ManagedUserUpdateWrite`, `UserCreationResult`, `ManagedUserMapper`, and `ManagedUserStore` are all importable from `@bikerental/shared` without errors.
