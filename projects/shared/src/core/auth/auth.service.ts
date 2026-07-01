import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { catchError, map, Observable, of, switchMap, take, tap } from 'rxjs';
import { IdentityService } from '../api/generated';
import { UserProfileMapper } from '../mappers';
import { UserStore } from '../state/user.store';
import { readAccessTokenClaims } from './auth.token-claims';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oidc = inject(OidcSecurityService);
  private readonly identity = inject(IdentityService);
  private readonly userStore = inject(UserStore);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _roles = signal<string[]>([]);
  private readonly _uid = signal<string | null>(null);
  private readonly _mustChangePassword = signal(false);

  readonly isAuthenticated = computed(() => this.oidc.authenticated().isAuthenticated);
  readonly roles = this._roles.asReadonly();
  readonly uid = this._uid.asReadonly();
  readonly mustChangePassword = this._mustChangePassword.asReadonly();
  readonly isAdmin = computed(() => this._roles().includes('ADMIN'));
  readonly isOperator = computed(() => this._roles().includes('OPERATOR'));

  checkAuth(): Observable<LoginResponse> {
    return this.oidc.checkAuth().pipe(
      switchMap((result) => {
        if (!result.isAuthenticated) {
          this.resetClaims();
          return of(result);
        }
        this.hydrate();
        return this.syncClaims(result);
      }),
    );
  }

  login(): void {
    this.oidc.authorize();
  }

  logout(): void {
    this.oidc.logoff().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.userStore.clearUser();
  }

  refresh(): Observable<LoginResponse> {
    return this.oidc
      .forceRefreshSession()
      .pipe(switchMap((result) => (result.isAuthenticated ? this.syncClaims(result) : of(result))));
  }

  hydrate(): void {
    this.identity
      .me()
      .pipe(
        map((response) => UserProfileMapper.fromResponse(response)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (profile) => this.userStore.setUser(profile),
      });
  }

  private syncClaims(result: LoginResponse): Observable<LoginResponse> {
    return this.oidc.getPayloadFromAccessToken().pipe(
      take(1),
      tap((payload) => this.applyClaims(payload)),
      map(() => result),
      catchError(() => {
        this.resetClaims();
        return of(result);
      }),
    );
  }

  private applyClaims(payload: unknown): void {
    const claims = readAccessTokenClaims(payload);
    this._roles.set(claims.roles);
    this._uid.set(claims.uid);
    this._mustChangePassword.set(claims.mustChangePassword);
  }

  private resetClaims(): void {
    this._roles.set([]);
    this._uid.set(null);
    this._mustChangePassword.set(false);
  }
}
