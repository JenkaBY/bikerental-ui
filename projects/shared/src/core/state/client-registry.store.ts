import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of, Subscription } from 'rxjs';
import { finalize, map, switchMap, tap } from 'rxjs/operators';
import { GeoService } from '../api/geo/geo.service';
import { ClientsService, RequestOptions } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { ClientMapper } from '../mappers/client.mapper';
import { PageMapper } from '../mappers/page.mapper';
import type {
  Client,
  ClientDetailsWrite,
  ClientListQuery,
  ClientRegistrationWrite,
  ClientStatus,
  ClientSummary,
} from '../models/client.model';
import type { GeoLocationWrite } from '../models/geo.model';
import { GeoLocationLookupStore } from './geo-location-lookup.store';

export type ClientFormWrite<T> = Omit<T, 'businessGeoLocationId'>;

export interface ClientLocationChoice {
  readonly write: GeoLocationWrite;
  readonly unchangedId: number | null;
}

const INITIAL_QUERY: ClientListQuery = { status: null, query: '', pageIndex: 0, pageSize: 20 };

@Injectable({ providedIn: 'root' })
export class ClientRegistryStore {
  private readonly service = inject(ClientsService);
  private readonly geo = inject(GeoService);
  private readonly geoLookup = inject(GeoLocationLookupStore);

  private readonly _query = signal<ClientListQuery>(INITIAL_QUERY);
  private readonly _items = signal<ClientSummary[]>([]);
  private readonly _totalItems = signal(0);
  private readonly _loading = signal(false);
  private readonly _listError = signal<unknown>(null);
  private readonly _client = signal<Client | null>(null);
  private readonly _clientLoading = signal(false);
  private readonly _saving = signal(false);
  private listSub?: Subscription;

  readonly query = computed(() => this._query());
  readonly items = computed(() => this._items());
  readonly totalItems = computed(() => this._totalItems());
  readonly loading = computed(() => this._loading());
  readonly listError = computed(() => this._listError());
  readonly client = computed(() => this._client());
  readonly clientLoading = computed(() => this._clientLoading());
  readonly saving = computed(() => this._saving());

  setStatus(status: ClientStatus | null): void {
    this.search({ ...this._query(), status, pageIndex: 0 });
  }

  setText(query: string): void {
    const trimmed = query.trim();
    if (trimmed === this._query().query) return;
    this.search({ ...this._query(), query: trimmed, pageIndex: 0 });
  }

  setPage(pageIndex: number, pageSize: number): void {
    this.search({ ...this._query(), pageIndex, pageSize });
  }

  reload(): void {
    this.search(this._query());
  }

  loadClient(slug: string, options?: RequestOptions<'json'>): Observable<Client> {
    if (this._client()?.slug !== slug) this._client.set(null);
    this._clientLoading.set(true);
    return this.service.getClient(slug, 'body', options).pipe(
      map(ClientMapper.fromResponse),
      tap((client) => this._client.set(client)),
      finalize(() => this._clientLoading.set(false)),
    );
  }

  register(
    write: ClientFormWrite<ClientRegistrationWrite>,
    location: ClientLocationChoice,
  ): Observable<Client> {
    this._saving.set(true);
    return this.resolveLocation(location).pipe(
      switchMap((businessGeoLocationId) =>
        this.service.registerClient(
          ClientMapper.toRequest({ ...write, businessGeoLocationId }),
          'body',
          { context: suppressErrorNotification() },
        ),
      ),
      map(ClientMapper.fromResponse),
      tap((client) => this._client.set(client)),
      finalize(() => this._saving.set(false)),
    );
  }

  update(
    client: Client,
    write: ClientFormWrite<ClientDetailsWrite>,
    location: ClientLocationChoice,
  ): Observable<Client> {
    this._saving.set(true);
    return this.resolveLocation(location).pipe(
      switchMap((businessGeoLocationId) =>
        this.service.editClient(
          client.slug,
          ClientMapper.toUpdateRequest({ ...write, businessGeoLocationId }, client.version),
          'body',
          { context: suppressErrorNotification() },
        ),
      ),
      map(ClientMapper.fromResponse),
      tap((updated) => {
        this._client.set(updated);
        this._items.update((items) =>
          items.map((item) => (item.slug === updated.slug ? updated : item)),
        );
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  private resolveLocation(location: ClientLocationChoice): Observable<number> {
    if (location.unchangedId !== null) return of(location.unchangedId);
    return this.geo.saveLocation(location.write, { context: suppressErrorNotification() }).pipe(
      tap((saved) => this.geoLookup.put(saved)),
      map((saved) => saved.id),
    );
  }

  private search(query: ClientListQuery): void {
    this._query.set(query);
    this.listSub?.unsubscribe();
    this._loading.set(true);
    this._listError.set(null);
    this.listSub = this.service
      .listClients(
        { page: query.pageIndex, size: query.pageSize },
        query.status ?? undefined,
        query.query || undefined,
        'body',
        { context: suppressErrorNotification() },
      )
      .pipe(
        map((page) => PageMapper.fromResponse(page, ClientMapper.fromSummaryResponse)),
        finalize(() => this._loading.set(false)),
      )
      .subscribe({
        next: (page) => {
          this._items.set(page.items);
          this._totalItems.set(page.totalItems);
        },
        error: (err: unknown) => this._listError.set(err),
      });
  }
}
