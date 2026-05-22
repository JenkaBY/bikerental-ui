# Task 003: Create `TimeTravelMapper` Pure Static Class

> **Applied Skill:** `angular-data-flow-orchestrator` — new mapper declared in `core/mappers/` as a pure static class; imports only from `@api-models` and `@ui-models`; zero Angular DI, zero side effects

## 1. Objective

Create `TimeTravelMapper` with two static methods:

* `fromSseMessage(raw: string): ServerTime` — deserialises a raw SSE `data:` JSON string into a `ServerTime` value object, converting the `instant` ISO-8601 string to a `Date`.
* `toSetRequest(date: Date): SetTimeRequest` — serialises a `Date` into the `SetTimeRequest` API shape by calling `date.toISOString()`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/mappers/time-travel.mapper.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import type { SetTimeRequest } from '@api-models';
import type { ServerTime } from '@ui-models';
```

**Code to Add/Replace:**

* **Location:** New file; paste the entire content below.

* **Snippet:**

```typescript
import type { SetTimeRequest } from '@api-models';
import type { ServerTime } from '@ui-models';

export class TimeTravelMapper {
  static fromSseMessage(raw: string): ServerTime {
    const parsed = JSON.parse(raw) as { instant: string; fixed: boolean };
    return {
      instant: new Date(parsed.instant),
      fixed: parsed.fixed,
    };
  }

  static toSetRequest(date: Date): SetTimeRequest {
    return { instant: date.toISOString() };
  }
}
```

**Key Rules:**

* `SetTimeRequest` is imported only as a `type` — it must never be used at runtime beyond this mapper.
* `JSON.parse` returns `unknown` at runtime; the cast to `{ instant: string; fixed: boolean }` is intentional. No additional validation is required per FR-02 scope.

## 4. Validation Steps

skip
