# Task 002: Managed User Domain Model

> **Applied Skills:** `typescript-es2022` (interfaces, readonly fields, strict optional typing), `angular-component` (pure domain-model module, no Angular DI, no side effects) — establishes the read model, the two write models mirroring the `PUT`/`POST` contracts exactly, and the transient one-time-reveal result type, per FR-01's design.

## 1. Objective

Create `managed-user.model.ts` exporting `ManagedUser` (read model), `ManagedUserCreateWrite` and `ManagedUserUpdateWrite` (write models mirroring the backend `POST`/`PUT` contracts exactly), and `UserCreationResult` (the transient one-time temporary-password reveal result). These are the only user-account types components/dialogs are allowed to import — never `core/api/generated/` directly.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/models/managed-user.model.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import type { Role } from './role.model';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import type { Role } from './role.model';

export interface ManagedUser {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly displayName: string;
  readonly status: 'ACTIVE' | 'DISABLED';
  readonly mustChangePassword: boolean;
  readonly roles: Role[];
  readonly lastLoginAt?: Date;
}

export interface ManagedUserCreateWrite {
  username: string;
  email: string;
  displayName?: string;
  roles: Role[];
  password?: string;
}

export interface ManagedUserUpdateWrite {
  displayName?: string;
  roles?: Role[];
  status?: 'ACTIVE' | 'DISABLED';
}

export interface UserCreationResult {
  readonly user: ManagedUser;
  readonly temporaryPassword: string;
}
```

**Note:** `ManagedUserUpdateWrite` deliberately has no `username`/`email` fields — this makes it structurally impossible to submit those immutable fields to the `PUT` endpoint, per FR-01's design (Non-Functional Architecture Decisions, Security & Auth).

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
