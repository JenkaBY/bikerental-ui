import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import type {
  ClientChangeResponse,
  PageRequest,
  PlatformManagerResponse,
  UserResponse,
} from '@api-models';
import { ClientsService, PlatformManagersService, UsersService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { ClientChangeMapper } from '../mappers/client-change.mapper';
import type { ClientChangeRow } from '../models/client-change.model';
import { Labels } from '../../shared/constant/labels';

interface ClientChangePageResponse {
  items?: ClientChangeResponse[];
  totalItems?: number;
  pageRequest?: PageRequest;
}

interface ClientChangePage {
  rows: ClientChangeRow[];
  totalItems: number;
}

interface ClientChangeQuery {
  slug: string;
  pageIndex: number;
  pageSize: number;
}

const EMPTY_PAGE: ClientChangePage = { rows: [], totalItems: 0 };
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ClientChangeHistoryStore {
  private readonly service = inject(ClientsService);
  private readonly usersService = inject(UsersService);
  private readonly managersService = inject(PlatformManagersService);

  private readonly _query = signal<ClientChangeQuery | null>(null);
  private readonly _page = signal<ClientChangePage>(EMPTY_PAGE);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);
  private sub?: Subscription;

  readonly rows = computed(() => this._page().rows);
  readonly totalItems = computed(() => this._page().totalItems);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly pageIndex = computed(() => this._query()?.pageIndex ?? 0);
  readonly pageSize = computed(() => this._query()?.pageSize ?? DEFAULT_PAGE_SIZE);

  load(slug: string): void {
    if (this._query()?.slug !== slug) this._page.set(EMPTY_PAGE);
    this.fetch({ slug, pageIndex: 0, pageSize: this.pageSize() });
  }

  setPage(pageIndex: number, pageSize: number): void {
    const query = this._query();
    if (query) this.fetch({ ...query, pageIndex, pageSize });
  }

  reload(): void {
    const query = this._query();
    if (query) this.fetch(query);
  }

  private fetch(query: ClientChangeQuery): void {
    this._query.set(query);
    this._loading.set(true);
    this._error.set(false);
    this.sub?.unsubscribe();
    this.sub = this.service
      .listClientChanges(query.slug, {}, { page: query.pageIndex, size: query.pageSize }, 'body', {
        context: suppressErrorNotification(),
      })
      .pipe(
        map((response) => response as unknown as ClientChangePageResponse),
        switchMap((response) => this.withAuthors(response)),
        catchError(() => {
          this._error.set(true);
          return of<ClientChangePage | null>(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((page) => {
        if (page) this._page.set(page);
      });
  }

  private withAuthors(response: ClientChangePageResponse): Observable<ClientChangePage> {
    const changes = (response.items ?? []).map(ClientChangeMapper.fromResponse);
    const totalItems = response.totalItems ?? 0;
    const ids = [...new Set(changes.flatMap((c) => (c.changedBy ? [c.changedBy] : [])))];

    return this.resolveNames(ids).pipe(
      map((names) => {
        return {
          rows: changes.map((change) => ({
            change,
            author: change.changedBy
              ? names.get(change.changedBy) || change.changedBy
              : Labels.ClientHistorySystemAuthor,
          })),
          totalItems,
        };
      }),
    );
  }

  private resolveNames(ids: string[]): Observable<Map<string, string>> {
    if (!ids.length) return of(new Map<string, string>());
    const options = { context: suppressErrorNotification() };
    return this.usersService.list(ids, 'body', options).pipe(
      catchError(() => of<UserResponse[]>([])),
      map((users) => toNameMap(users)),
      switchMap((names) => {
        if (ids.every((id) => names.has(id))) return of(names);
        return this.managersService.listPlatformManagers('body', options).pipe(
          catchError(() => of<PlatformManagerResponse[]>([])),
          map((managers) => new Map([...toNameMap(managers), ...names])),
        );
      }),
    );
  }
}

function toNameMap(
  accounts: readonly { id?: string; displayName?: string; username?: string }[],
): Map<string, string> {
  const names = new Map<string, string>();
  for (const a of accounts) {
    const name = a.displayName || a.username;
    if (a.id && name) names.set(a.id, name);
  }
  return names;
}
