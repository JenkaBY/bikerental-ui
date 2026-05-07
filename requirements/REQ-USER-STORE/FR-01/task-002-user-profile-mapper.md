# Task 002: Create UserProfileMapper

> **Applied Skill:** `angular-data-flow-orchestrator` — mapper must be a pure static class in `core/mappers/` with a `fromResponse()` method; no Angular DI, no side effects; registered in `mappers/index.ts` barrel

## 1. Objective

Create the `UserProfileMapper` pure static class that converts a raw auth-response shape into a `UserProfile` domain object, computing the `isAdmin` and `isOperator` UI flags from the `roles` array.

## 2. File to Modify / Create

### 2a. New File

* **File Path:** `projects/shared/src/core/mappers/user-profile.mapper.ts`
* **Action:** Create New File

### 2b. Existing Barrel

* **File Path:** `projects/shared/src/core/mappers/index.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### 2a — `user-profile.mapper.ts`

**Imports Required:**

```typescript
import type { UserProfile } from '@ui-models';
```

**Code to Add:**

* **Location:** New file — full content

```typescript
import type { UserProfile } from '@ui-models';

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export class UserProfileMapper {
  static fromResponse(r: UserProfileResponse): UserProfile {
    return {
      id: r.id,
      email: r.email,
      firstName: r.firstName,
      lastName: r.lastName,
      roles: r.roles,
      isAdmin: r.roles.includes('ADMIN'),
      isOperator: r.roles.includes('OPERATOR'),
    };
  }
}
```

> **Note on `UserProfileResponse`:** The backend `/api/auth/login` response shape is not yet in the generated OpenAPI client (TASK002 is pending). Declare `UserProfileResponse` as a local interface in this file as a placeholder. When TASK002 lands and the generated type becomes available in `core/api/generated/models/`, replace `UserProfileResponse` with the generated type and remove this local declaration.

### 2b — `core/mappers/index.ts`

**Code to Add:**

* **Location:** Append as the last line of `projects/shared/src/core/mappers/index.ts`

The file currently ends with:

```typescript
export * from './customer-finance.mapper';
```

Add directly after it:

```typescript
export * from './user-profile.mapper';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npm run build -- --project=shared
```
