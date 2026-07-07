# Task 012: AgreementSigningStore (Feature Store)

> **Applied Skills:** `angular-signals` (signal-based state, computed read-only exposure),
> `angular-di` (`@Injectable()` **feature** scope — provided in the components that open the
> signing dialog, NOT `providedIn: 'root'`, mirroring `AgreementTemplateStore` from FR-01),
> `error-handling` (`loadActiveTemplate`/`sign` pass `{ context: suppressErrorNotification() }` so
> `SigningFlowService` resolves all errors itself and the global interceptor does not double-toast)
> — implements FR-03 design section 3, bullet 6.

## 1. Objective

Create `AgreementSigningStore`, a feature-scoped signal store exposing `template`/`isLoadingTemplate`/
`isSigning` computeds and `loadActiveTemplate()`/`sign()` methods, backed by the generated
`AgreementsService` and reusing `AgreementTemplateMapper` from FR-01.

`operatorId` is NOT injected from `RentalStore` inside this store (that would couple a shared
feature store to another feature store and complicate provider ordering) — callers pass
`operatorId` as an explicit parameter to `sign()`, reading it from `RentalStore.operatorId()`
themselves.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/agreement-signing.store.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { AgreementsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { AgreementSignatureMapper } from '../mappers/agreement-signature.mapper';
import { AgreementTemplateMapper } from '../mappers/agreement-template.mapper';
import type { AgreementTemplate } from '../models/agreement-template.model';
import type { SignatureCreated } from '../models/agreement-signature.model';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { AgreementsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { AgreementSignatureMapper } from '../mappers/agreement-signature.mapper';
import { AgreementTemplateMapper } from '../mappers/agreement-template.mapper';
import type { AgreementTemplate } from '../models/agreement-template.model';
import type { SignatureCreated } from '../models/agreement-signature.model';

interface AgreementSigningState {
  template: AgreementTemplate | null;
  isLoadingTemplate: boolean;
  isSigning: boolean;
}

@Injectable()
export class AgreementSigningStore {
  private readonly service = inject(AgreementsService);

  private readonly _state = signal<AgreementSigningState>({
    template: null,
    isLoadingTemplate: false,
    isSigning: false,
  });

  readonly template = computed(() => this._state().template);
  readonly isLoadingTemplate = computed(() => this._state().isLoadingTemplate);
  readonly isSigning = computed(() => this._state().isSigning);

  loadActiveTemplate(): Observable<AgreementTemplate> {
    this._state.update((s) => ({ ...s, isLoadingTemplate: true }));
    return this.service.getActive(undefined, { context: suppressErrorNotification() }).pipe(
      map(AgreementTemplateMapper.fromResponse),
      tap((template) => this._state.update((s) => ({ ...s, template }))),
      finalize(() => this._state.update((s) => ({ ...s, isLoadingTemplate: false }))),
    );
  }

  sign(
    rentalId: number,
    signaturePng: string,
    rentalVersion: number,
    operatorId: string,
  ): Observable<SignatureCreated> {
    const templateId = this._state().template?.id ?? 0;
    this._state.update((s) => ({ ...s, isSigning: true }));
    return this.service
      .sign(
        rentalId,
        { signaturePng, rentalVersion, templateId, operatorId },
        undefined,
        { context: suppressErrorNotification() },
      )
      .pipe(
        map(AgreementSignatureMapper.fromCreatedResponse),
        finalize(() => this._state.update((s) => ({ ...s, isSigning: false }))),
      );
  }
}
```

**Note on feature scope:** like `AgreementTemplateStore` (FR-01), this store is `@Injectable()` with
no `providedIn` — it is provided in `RentalStep3Component`'s and `RentalDetailComponent`'s
`providers: []` (Tasks 016/018) so the dialog (opened with `viewContainerRef`) resolves the same
instance.

**Note on `operatorId` parameter:** per this task's objective, `sign()` takes `operatorId` as its
4th parameter instead of injecting `RentalStore` — this keeps `AgreementSigningStore` free of any
dependency on `RentalStore`, avoiding a shared-store-depends-on-feature-store coupling.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
