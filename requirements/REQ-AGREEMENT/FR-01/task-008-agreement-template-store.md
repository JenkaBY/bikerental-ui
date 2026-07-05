# Task 008: AgreementTemplateStore (Feature Store)

> **Applied Skills:** `angular-signals` (signal-based state, computed read-only exposure),
> `angular-di` (`@Injectable()` **feature** scope — provided in the list component's `providers:
> []`, NOT `providedIn: 'root'`), `error-handling` (`create`/`update` pass
> `{ context: suppressErrorNotification() }` so the dialog can bind server errors inline;
> `activate`/`delete` also suppress so the list component resolves 409s itself) — implements the
> store per FR-01's design section 3.

## 1. Objective

Create `AgreementTemplateStore`, a feature-scoped signal store exposing `templates`/`isLoading`
computeds and `load`/`getById`/`create`/`update`/`activate`/`delete`/`previewPdf` methods, backed by
the generated `AgreementsService`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/agreement-template.store.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { AgreementsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { AgreementTemplateMapper } from '../mappers';
import type { AgreementTemplate, AgreementTemplateSummary, AgreementTemplateWrite } from '../models';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { AgreementsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { AgreementTemplateMapper } from '../mappers';
import type {
  AgreementTemplate,
  AgreementTemplateSummary,
  AgreementTemplateWrite,
} from '../models';

interface AgreementTemplateState {
  templates: AgreementTemplateSummary[];
  isLoading: boolean;
}

@Injectable()
export class AgreementTemplateStore {
  private readonly service = inject(AgreementsService);

  private readonly _state = signal<AgreementTemplateState>({
    templates: [],
    isLoading: false,
  });

  readonly templates = computed(() => this._state().templates);
  readonly isLoading = computed(() => this._state().isLoading);

  load(): void {
    this._state.update((s) => ({ ...s, isLoading: true }));
    this.service
      .findAll()
      .pipe(
        map((responses) => responses.map(AgreementTemplateMapper.fromSummaryResponse)),
        finalize(() => this._state.update((s) => ({ ...s, isLoading: false }))),
      )
      .subscribe({
        next: (templates) => this._state.update((s) => ({ ...s, templates })),
        error: () => undefined,
      });
  }

  getById(id: number): Observable<AgreementTemplate> {
    return this.service.getById(id).pipe(map(AgreementTemplateMapper.fromResponse));
  }

  create(write: AgreementTemplateWrite): Observable<AgreementTemplate> {
    return this.service
      .create(AgreementTemplateMapper.toRequest(write), undefined, {
        context: suppressErrorNotification(),
      })
      .pipe(map(AgreementTemplateMapper.fromResponse));
  }

  update(id: number, write: AgreementTemplateWrite): Observable<AgreementTemplate> {
    return this.service
      .update(id, AgreementTemplateMapper.toRequest(write), undefined, {
        context: suppressErrorNotification(),
      })
      .pipe(map(AgreementTemplateMapper.fromResponse));
  }

  activate(id: number): Observable<void> {
    return this.service
      .activate(id, undefined, { context: suppressErrorNotification() })
      .pipe(map(() => undefined));
  }

  delete(id: number): Observable<void> {
    return this.service
      .delete(id, undefined, { context: suppressErrorNotification() })
      .pipe(map(() => undefined));
  }

  previewPdf(write: AgreementTemplateWrite): Observable<Blob> {
    return this.service.previewPdf(AgreementTemplateMapper.toPreviewRequest(write));
  }
}
```

**Note on feature scope:** unlike `EquipmentTypeStore`/`TariffStore`/`ManagedUserStore`
(`providedIn: 'root'`), this store is `@Injectable()` with no `providedIn` — it is provided in
`AgreementListComponent`'s `providers: [AgreementTemplateStore]` (Task 012) so the list and its
dialogs (opened with `viewContainerRef`, Tasks 010/011) share exactly one instance scoped to the
route, per FR-01's design section 3.

**Note on `load()`:** unlike `EquipmentTypeStore.load()` (which returns `Observable<void>` for the
caller to subscribe), this store's `load()` returns `void` and self-subscribes, per FR-01's design
("`load(): void` ... `finalize` clears loading; on error clear loading (global interceptor
toasts)") — the list component calls `store.load()` directly with no `.subscribe()`.

**Note on `create`/`update`/`activate`/`delete` suppressing notifications:** all four pass
`{ context: suppressErrorNotification() }` because their callers (the editor dialog for
create/update via `applyServerErrors`; the list component for activate/delete via
`ApiErrorParser`/`NotificationService` + mandatory `load()` on 409) render their own error handling
and must not also receive the global interceptor's toast.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
