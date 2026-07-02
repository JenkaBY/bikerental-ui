# Task 003: Managed User Mapper

> **Applied Skills:** `typescript-es2022` (pure static class, strict null handling), `angular-component` (no Angular DI, no side effects) — enforces the three-layer data pipeline rule: this mapper is the only code that converts between the generated `UsersService` API shapes and the `ManagedUser*` domain types from task-002.

## 1. Objective

Implement `ManagedUserMapper` as a pure static class in `managed-user.mapper.ts`, converting `UserResponse` to `ManagedUser`, both write domain types to their respective generated request shapes, and `UserCreationResponse` to `UserCreationResult`.

## 2. Files to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/managed-user.mapper.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserCreationResponse,
  UserResponse,
} from '@api-models';
import type {
  ManagedUser,
  ManagedUserCreateWrite,
  ManagedUserUpdateWrite,
  UserCreationResult,
} from '../models/managed-user.model';
import type { Role } from '../models/role.model';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserCreationResponse,
  UserResponse,
} from '@api-models';
import type {
  ManagedUser,
  ManagedUserCreateWrite,
  ManagedUserUpdateWrite,
  UserCreationResult,
} from '../models/managed-user.model';
import type { Role } from '../models/role.model';

export class ManagedUserMapper {
  static fromResponse(r: UserResponse): ManagedUser {
    return {
      id: r.id ?? '',
      username: r.username ?? '',
      email: r.email ?? '',
      displayName: r.displayName ?? '',
      status: r.status ?? 'ACTIVE',
      mustChangePassword: r.mustChangePassword ?? false,
      roles: (r.roles ?? []) as Role[],
      lastLoginAt: r.lastLoginAt ? new Date(r.lastLoginAt) : undefined,
    };
  }

  static toCreateRequest(w: ManagedUserCreateWrite): CreateUserRequest {
    return {
      username: w.username,
      email: w.email,
      displayName: w.displayName || undefined,
      roles: w.roles,
      password: w.password || undefined,
    };
  }

  static toUpdateRequest(w: ManagedUserUpdateWrite): UpdateUserRequest {
    return {
      displayName: w.displayName,
      roles: w.roles,
      status: w.status,
    };
  }

  static fromCreationResponse(r: UserCreationResponse): UserCreationResult {
    return {
      user: ManagedUserMapper.fromResponse(r.user ?? {}),
      temporaryPassword: r.temporaryPassword ?? '',
    };
  }
}
```

**Note on `roles as Role[]`:** the generated `UserResponse.roles` type is already `Array<'ADMIN' | 'OPERATOR'>`, structurally identical to `Role[]`; the cast exists only because the generated type is a local literal union rather than an import of `Role` — no runtime behavior changes.

## 4. Validation Steps

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
