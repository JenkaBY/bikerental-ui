import { computed, inject, Injectable, signal } from '@angular/core';
import { of, Subscription } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import type { ClientPointResponse, PageRequest } from '@api-models';
import { ClientsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { ApiErrorParser } from '../errors/api-error.parser';
import { ErrorMessageResolver } from '../errors/error-message.resolver';
import { ClientPointMapper } from '../mappers/client-point.mapper';
import type { ClientPoint } from '../models/client-point.model';
import type { PointStatus } from '../models/point.model';
import { GeoLocationLookupStore } from './geo-location-lookup.store';

interface ClientPointPageResponse {
  items?: ClientPointResponse[];
  totalItems?: number;
  pageRequest?: PageRequest;
}

interface ClientPointPage {
  points: ClientPoint[];
  totalItems: number;
}

interface ClientPointQuery {
  slug: string;
  status: PointStatus | null;
  pageIndex: number;
  pageSize: number;
}

const EMPTY_PAGE: ClientPointPage = { points: [], totalItems: 0 };
const DEFAULT_PAGE_SIZE = 20;

@Injectable()
export class ClientPointsStore {
  private readonly service = inject(ClientsService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly lookup = inject(GeoLocationLookupStore);

  private readonly _query = signal<ClientPointQuery | null>(null);
  private readonly _page = signal<ClientPointPage>(EMPTY_PAGE);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private sub?: Subscription;

  readonly points = computed(() => this._page().points);
  readonly totalItems = computed(() => this._page().totalItems);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly status = computed(() => this._query()?.status ?? null);
  readonly pageIndex = computed(() => this._query()?.pageIndex ?? 0);
  readonly pageSize = computed(() => this._query()?.pageSize ?? DEFAULT_PAGE_SIZE);

  load(slug: string): void {
    const query = this._query();
    if (query?.slug !== slug) this._page.set(EMPTY_PAGE);
    this.fetch({
      slug,
      status: query?.slug === slug ? query.status : null,
      pageIndex: 0,
      pageSize: this.pageSize(),
    });
  }

  setStatus(status: PointStatus | null): void {
    const query = this._query();
    if (query) this.fetch({ ...query, status, pageIndex: 0 });
  }

  setPage(pageIndex: number, pageSize: number): void {
    const query = this._query();
    if (query) this.fetch({ ...query, pageIndex, pageSize });
  }

  reload(): void {
    const query = this._query();
    if (query) this.fetch(query);
  }

  private fetch(query: ClientPointQuery): void {
    this._query.set(query);
    this._loading.set(true);
    this._error.set(null);
    this.sub?.unsubscribe();
    this.sub = this.service
      .listClientPoints(
        query.slug,
        { page: query.pageIndex, size: query.pageSize },
        query.status ?? undefined,
        'body',
        { context: suppressErrorNotification() },
      )
      .pipe(
        map((response) => response as unknown as ClientPointPageResponse),
        map((response) => ({
          points: (response.items ?? []).map(ClientPointMapper.fromResponse),
          totalItems: response.totalItems ?? 0,
        })),
        catchError((err: unknown) => {
          this._error.set(this.resolver.resolve(ApiErrorParser.parse(err)));
          return of<ClientPointPage | null>(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((page) => {
        if (!page) return;
        this._page.set(page);
        this.lookup.ensure(page.points.map((p) => p.geoLocationId));
      });
  }
}
