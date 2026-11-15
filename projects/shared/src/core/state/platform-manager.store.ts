import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { PlatformManagersService, RequestOptions } from '../api/generated';
import { PlatformManagerMapper } from '../mappers';
import type {
  PlatformManager,
  PlatformManagerCreateWrite,
  PlatformManagerCreationResult,
} from '../models';

@Injectable({ providedIn: 'root' })
export class PlatformManagerStore {
  private readonly service = inject(PlatformManagersService);

  private readonly _managers = signal<PlatformManager[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly managers = computed(() => this._managers());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  load(options?: RequestOptions<'json'>): Observable<void> {
    this._loading.set(true);
    return this.service.listPlatformManagers(undefined, options).pipe(
      map((responses) => responses.map(PlatformManagerMapper.fromResponse)),
      tap((managers) => this._managers.set(managers)),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
    );
  }

  create(
    write: PlatformManagerCreateWrite,
    options?: RequestOptions<'json'>,
  ): Observable<PlatformManagerCreationResult> {
    this._saving.set(true);
    return this.service
      .createPlatformManager(PlatformManagerMapper.toCreateRequest(write), undefined, options)
      .pipe(
        map(PlatformManagerMapper.fromCreationResponse),
        tap((result) => this._managers.set([result.manager, ...this._managers()])),
        finalize(() => this._saving.set(false)),
      );
  }

  deactivate(id: string, options?: RequestOptions<'json'>): Observable<PlatformManager> {
    this._saving.set(true);
    return this.service.deactivatePlatformManager(id, undefined, options).pipe(
      map(PlatformManagerMapper.fromResponse),
      tap((updated) =>
        this._managers.set(this._managers().map((m) => (m.id === updated.id ? updated : m))),
      ),
      finalize(() => this._saving.set(false)),
    );
  }
}
