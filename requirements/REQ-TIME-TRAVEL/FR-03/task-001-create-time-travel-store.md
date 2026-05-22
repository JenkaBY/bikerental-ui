# Task 001: Create `TimeTravelStore`

> **Applied Skill:** `angular-signals` — signal-based store with `signal()` / `computed()` for reactive state; `DestroyRef.onDestroy()` for resource cleanup; `inject()` for all DI; `providedIn: 'root'` for singleton scope

## 1. Objective

Create the `TimeTravelStore` injectable that:

* Opens a native `EventSource` SSE connection to `GET /api/dev/time` on construction (only when `timeTravelEnabled` is `true`)
* Parses each incoming SSE message via `TimeTravelMapper.fromSseMessage()` and writes the result into a private signal
* Exposes a read-only `serverTime` computed signal (`ServerTime | null`, starting at `null`)
* Silently retains the last value on `onerror` (no handler needed — `EventSource` natively reconnects)
* Closes the `EventSource` via `DestroyRef.onDestroy()`
* Exposes `setTime(date: Date): Observable<void>` and `resetTime(): Observable<void>` delegating to the generated service

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/time-travel.store.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TimeTravelControllerService } from '../api/generated';
import { TimeTravelMapper } from '../mappers';
import type { ServerTime } from '@ui-models';
```

**Code to Add/Replace:**

* **Location:** New file; paste the entire content below.

* **Snippet:**

```typescript
import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { TimeTravelControllerService } from '../api/generated';
import { TimeTravelMapper } from '../mappers';
import type { ServerTime } from '@ui-models';

@Injectable({ providedIn: 'root' })
export class TimeTravelStore {
  private readonly service = inject(TimeTravelControllerService);
  private readonly destroyRef = inject(DestroyRef);

  readonly timeTravelEnabled = environment.timeTravelEnabled;

  private readonly _serverTime = signal<ServerTime | null>(null);
  readonly serverTime = computed(() => this._serverTime());

  constructor() {
    if (!this.timeTravelEnabled) return;

    const source = new EventSource(`${environment.apiUrl}/api/dev/time`);
    source.onmessage = (event: MessageEvent) => {
      this._serverTime.set(TimeTravelMapper.fromSseMessage(event.data as string));
    };
    this.destroyRef.onDestroy(() => source.close());
  }

  setTime(date: Date): Observable<void> {
    return this.service.setTime(TimeTravelMapper.toSetRequest(date)).pipe(map(() => undefined));
  }

  resetTime(): Observable<void> {
    return this.service.resetTime().pipe(map(() => undefined));
  }
}
```

**Key Rules:**

* `readonly timeTravelEnabled = environment.timeTravelEnabled;` exposes the flag so that consuming templates can use it directly (e.g., `@if (store.timeTravelEnabled)`) without importing `environment` in the component.
* The `if (!this.timeTravelEnabled) return;` guard in the constructor is the single enforcement point that prevents an SSE connection in production builds.
* `onerror` is intentionally not handled — the `EventSource` native reconnect logic retains the last signal value automatically.
* `TimeTravelControllerService.setTime()` returns `Observable<TimeResponse>`; the `.pipe(map(() => undefined))` maps it to `Observable<void>` so that consumers never need to import the generated `TimeResponse` type.
* `TimeTravelControllerService.resetTime()` returns `Observable<any>`; the same `map(() => undefined)` pattern applies.

## 4. Validation Steps

skip