import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import type { PageRequest, SettingChangeResponse, UserResponse } from '@api-models';
import { BusinessSettingsService, UsersService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { BusinessSettingMapper } from '../mappers/business-setting.mapper';
import type { BusinessSettingChange, BusinessSettingChangeFilter } from '../models';

export interface BusinessSettingHistoryQuery extends BusinessSettingChangeFilter {
  readonly pageIndex: number;
  readonly pageSize: number;
}

export interface BusinessSettingHistoryRow {
  readonly change: BusinessSettingChange;
  readonly author: string;
}

interface SettingChangePageResponse {
  items?: SettingChangeResponse[];
  totalItems?: number;
  pageRequest?: PageRequest;
}

interface HistoryPage {
  rows: BusinessSettingHistoryRow[];
  totalItems: number;
}

const EMPTY_PAGE: HistoryPage = { rows: [], totalItems: 0 };

@Injectable()
export class BusinessSettingHistoryStore {
  private readonly service = inject(BusinessSettingsService);
  private readonly usersService = inject(UsersService);

  private readonly _query = signal<BusinessSettingHistoryQuery | null>(null);
  private readonly _page = signal<HistoryPage>(EMPTY_PAGE);
  private readonly _loading = signal(false);
  private readonly _error = signal(false);

  readonly rows = computed(() => this._page().rows);
  readonly totalItems = computed(() => this._page().totalItems);
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());
  readonly pageIndex = computed(() => this._query()?.pageIndex ?? 0);
  readonly pageSize = computed(() => this._query()?.pageSize ?? 20);

  search(query: BusinessSettingHistoryQuery): void {
    this._query.set(query);
    this.fetch(query);
  }

  reload(): void {
    const query = this._query();
    if (query) this.fetch(query);
  }

  private fetch(query: BusinessSettingHistoryQuery): void {
    this._loading.set(true);
    this._error.set(false);
    this.service
      .getChanges(
        {
          settingKey: query.settingKey || undefined,
          from: query.from ? startOfDay(query.from).toISOString() : undefined,
          to: query.to ? startOfNextDay(query.to).toISOString() : undefined,
        },
        { page: query.pageIndex, size: query.pageSize },
      )
      .pipe(
        map((response) => response as unknown as SettingChangePageResponse),
        switchMap((response) => this.withAuthors(response)),
        catchError(() => {
          this._error.set(true);
          return of<HistoryPage | null>(null);
        }),
        finalize(() => this._loading.set(false)),
      )
      .subscribe((page) => {
        if (page) this._page.set(page);
      });
  }

  private withAuthors(response: SettingChangePageResponse): Observable<HistoryPage> {
    const changes = (response.items ?? []).map(BusinessSettingMapper.changeFromResponse);
    const totalItems = response.totalItems ?? 0;
    const ids = [...new Set(changes.map((c) => c.changedBy).filter(Boolean))];

    const users$ = ids.length
      ? this.usersService
          .list(ids, 'body', { context: suppressErrorNotification() })
          .pipe(catchError(() => of<UserResponse[]>([])))
      : of<UserResponse[]>([]);

    return users$.pipe(
      map((users) => {
        const names = new Map(
          users.map((u) => [u.id ?? '', u.displayName || u.username || u.id || '']),
        );
        return {
          rows: changes.map((change) => ({
            change,
            author: names.get(change.changedBy) || change.changedBy,
          })),
          totalItems,
        };
      }),
    );
  }
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfNextDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}
