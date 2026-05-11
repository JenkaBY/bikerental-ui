# Task 002: Add `CustomerMapper.fromSearchResponse()` Method

> **Applied Skill:** `angular-data-flow-orchestrator` — All API response types must pass through a mapper before entering the domain layer. `CustomerSearchResponse` is a lighter projection returned by `searchByPhone()`; it needs its own `fromSearchResponse` mapper that produces the same `Customer` domain model used everywhere else.

## 1. Objective

Add a static `fromSearchResponse(r: CustomerSearchResponse): Customer` method to `CustomerMapper`. This method maps the search-specific API projection (`id`, `phone`, `firstName?`, `lastName?`) to the `Customer` domain model, filling in `''` for absent name fields and leaving optional fields (`email`, `birthDate`, `notes`) undefined.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/customer.mapper.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
import type { CustomerRequest, CustomerResponse, CustomerSearchResponse } from '@api-models';
```

Replace the existing import line:

```typescript
import type { CustomerRequest, CustomerResponse } from '@api-models';
```

With:

```typescript
import type { CustomerRequest, CustomerResponse, CustomerSearchResponse } from '@api-models';
```

**Code to Add/Replace:**

* **Location:** Inside the `CustomerMapper` class, immediately after the closing `}` of the existing `fromResponse` method and before the `toRequest` method.
* **Snippet:**

Replace:

```typescript
  static toRequest(w: CustomerWrite): CustomerRequest {
```

With:

```typescript
  static fromSearchResponse(r: CustomerSearchResponse): Customer {
    return {
      id: r.id,
      phone: r.phone,
      firstName: r.firstName ?? '',
      lastName: r.lastName ?? '',
    };
  }

  static toRequest(w: CustomerWrite): CustomerRequest {
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build shared
```
