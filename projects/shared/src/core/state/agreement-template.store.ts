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

export type AgreementTemplateSortColumn = 'versionNumber' | 'createdAt';
export type AgreementTemplateSortDirection = 'asc' | 'desc';

interface AgreementTemplateState {
  templates: AgreementTemplateSummary[];
  isLoading: boolean;
  isFetchingDetail: boolean;
  isSaving: boolean;
  isPreviewing: boolean;
  busyIds: ReadonlySet<number>;
  sortColumn: AgreementTemplateSortColumn;
  sortDirection: AgreementTemplateSortDirection;
}

@Injectable()
export class AgreementTemplateStore {
  private readonly service = inject(AgreementsService);

  private readonly _state = signal<AgreementTemplateState>({
    templates: [],
    isLoading: false,
    isFetchingDetail: false,
    isSaving: false,
    isPreviewing: false,
    busyIds: new Set<number>(),
    sortColumn: 'createdAt',
    sortDirection: 'desc',
  });

  readonly templates = computed(() => this._state().templates);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly isFetchingDetail = computed(() => this._state().isFetchingDetail);
  readonly isSaving = computed(() => this._state().isSaving);
  readonly isPreviewing = computed(() => this._state().isPreviewing);
  readonly busyIds = computed(() => this._state().busyIds);
  readonly sortColumn = computed(() => this._state().sortColumn);
  readonly sortDirection = computed(() => this._state().sortDirection);

  readonly sortedTemplates = computed(() => {
    const { templates, sortColumn, sortDirection } = this._state();
    const factor = sortDirection === 'asc' ? 1 : -1;

    return [...templates].sort((a, b) => {
      const av = sortColumn === 'versionNumber' ? (a.versionNumber ?? -1) : a.createdAt.getTime();
      const bv = sortColumn === 'versionNumber' ? (b.versionNumber ?? -1) : b.createdAt.getTime();
      return (av - bv) * factor;
    });
  });

  private patch(partial: Partial<AgreementTemplateState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }

  private setBusy(id: number, busy: boolean): void {
    this._state.update((s) => {
      const busyIds = new Set(s.busyIds);
      if (busy) {
        busyIds.add(id);
      } else {
        busyIds.delete(id);
      }
      return { ...s, busyIds };
    });
  }

  toggleSort(column: AgreementTemplateSortColumn): void {
    this._state.update((s) =>
      s.sortColumn === column
        ? { ...s, sortDirection: s.sortDirection === 'asc' ? 'desc' : 'asc' }
        : { ...s, sortColumn: column, sortDirection: 'asc' },
    );
  }

  load(): void {
    this.patch({ isLoading: true });
    this.service
      .findAll()
      .pipe(
        map((responses) => responses.map(AgreementTemplateMapper.fromSummaryResponse)),
        finalize(() => this.patch({ isLoading: false })),
      )
      .subscribe({
        next: (templates) => this.patch({ templates }),
        error: () => undefined,
      });
  }

  getById(id: number): Observable<AgreementTemplate> {
    this.patch({ isFetchingDetail: true });
    return this.service.getById(id).pipe(
      map(AgreementTemplateMapper.fromResponse),
      finalize(() => this.patch({ isFetchingDetail: false })),
    );
  }

  create(write: AgreementTemplateWrite): Observable<AgreementTemplate> {
    this.patch({ isSaving: true });
    return this.service
      .create(AgreementTemplateMapper.toRequest(write), undefined, {
        context: suppressErrorNotification(),
      })
      .pipe(
        map(AgreementTemplateMapper.fromResponse),
        finalize(() => this.patch({ isSaving: false })),
      );
  }

  update(id: number, write: AgreementTemplateWrite): Observable<AgreementTemplate> {
    this.patch({ isSaving: true });
    return this.service
      .update(id, AgreementTemplateMapper.toRequest(write), undefined, {
        context: suppressErrorNotification(),
      })
      .pipe(
        map(AgreementTemplateMapper.fromResponse),
        finalize(() => this.patch({ isSaving: false })),
      );
  }

  activate(id: number): Observable<void> {
    this.setBusy(id, true);
    return this.service.activate(id, undefined, { context: suppressErrorNotification() }).pipe(
      map(() => undefined),
      finalize(() => this.setBusy(id, false)),
    );
  }

  delete(id: number): Observable<void> {
    this.setBusy(id, true);
    return this.service.delete(id, undefined, { context: suppressErrorNotification() }).pipe(
      map(() => undefined),
      finalize(() => this.setBusy(id, false)),
    );
  }

  previewPdf(write: AgreementTemplateWrite): Observable<Blob> {
    this.patch({ isPreviewing: true });
    return this.service
      .previewPdf(AgreementTemplateMapper.toPreviewRequest(write))
      .pipe(finalize(() => this.patch({ isPreviewing: false })));
  }
}
