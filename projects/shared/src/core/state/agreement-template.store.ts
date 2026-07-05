import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
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
