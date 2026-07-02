import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { RequestOptions, UsersService } from '../api/generated';
import { ManagedUserMapper } from '../mappers';
import type {
  ManagedUser,
  ManagedUserCreateWrite,
  ManagedUserUpdateWrite,
  UserCreationResult,
} from '../models';

@Injectable({ providedIn: 'root' })
export class ManagedUserStore {
  private readonly service = inject(UsersService);

  private readonly _users = signal<ManagedUser[]>([]);
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);

  readonly users = computed(() => this._users());
  readonly loading = computed(() => this._loading());
  readonly saving = computed(() => this._saving());

  load(): Observable<void> {
    this._loading.set(true);
    return this.service.list().pipe(
      map((responses) => responses.map(ManagedUserMapper.fromResponse)),
      tap((users) => this._users.set(users)),
      map(() => undefined as void),
      finalize(() => this._loading.set(false)),
    );
  }

  create(
    write: ManagedUserCreateWrite,
    options?: RequestOptions<'json'>,
  ): Observable<UserCreationResult> {
    this._saving.set(true);
    return this.service.create(ManagedUserMapper.toCreateRequest(write), undefined, options).pipe(
      map(ManagedUserMapper.fromCreationResponse),
      tap((result) => {
        this._users.set([...this._users(), result.user]);
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  update(
    id: string,
    write: ManagedUserUpdateWrite,
    options?: RequestOptions<'json'>,
  ): Observable<ManagedUser> {
    this._saving.set(true);
    return this.service
      .update(id, ManagedUserMapper.toUpdateRequest(write), undefined, options)
      .pipe(
        map(ManagedUserMapper.fromResponse),
        tap((updated) => {
          this._users.set(this._users().map((u) => (u.id === updated.id ? updated : u)));
        }),
        finalize(() => this._saving.set(false)),
      );
  }

  resetPassword(id: string, options?: RequestOptions<'json'>): Observable<UserCreationResult> {
    this._saving.set(true);
    return this.service.resetPassword(id, undefined, options).pipe(
      map(ManagedUserMapper.fromCreationResponse),
      tap((result) => {
        this._users.set(this._users().map((u) => (u.id === result.user.id ? result.user : u)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }

  deactivate(id: string, options?: RequestOptions<'json'>): Observable<ManagedUser> {
    this._saving.set(true);
    return this.service.deactivate(id, undefined, options).pipe(
      map(ManagedUserMapper.fromResponse),
      tap((deactivated) => {
        this._users.set(this._users().map((u) => (u.id === deactivated.id ? deactivated : u)));
      }),
      finalize(() => this._saving.set(false)),
    );
  }
}
