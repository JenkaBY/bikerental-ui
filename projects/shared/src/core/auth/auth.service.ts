import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { LoginResponse, OidcSecurityService } from 'angular-auth-oidc-client';
import { catchError, finalize, map, Observable, of, shareReplay, switchMap, take, tap } from 'rxjs';
import { IdentityService } from '../api/generated';
import { UserProfileMapper } from '../mappers';
import { UserStore } from '../state/user.store';
import { readAccessTokenClaims } from './auth.token-claims';

const RETURN_URL_STORAGE_KEY = 'auth_return_url';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly oidc = inject(OidcSecurityService);
  private readonly identity = inject(IdentityService);
  private readonly userStore = inject(UserStore);
  private readonly router = inject(Router);
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

  private refreshInFlight$: Observable<LoginResponse> | null = null;

  checkAuth(): Observable<LoginResponse> {
    return this.oidc.checkAuth().pipe(
      switchMap((result) => {
        if (!result.isAuthenticated) {
          this.resetClaims();
          return of(result);
        }
        this.hydrate();
        this.restoreReturnUrl();
        return this.syncClaims(result);
      }),
    );
  }

  login(returnUrl?: string): void {
    this.saveReturnUrl(returnUrl ?? this.router.url);
    this.oidc.authorize();
  }

  logout(): void {
    this.oidc.logoff().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    this.userStore.clearUser();
  }

  refresh(): Observable<LoginResponse> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.oidc.forceRefreshSession().pipe(
        switchMap((result) => (result.isAuthenticated ? this.syncClaims(result) : of(result))),
        finalize(() => {
          this.refreshInFlight$ = null;
        }),
        shareReplay(1),
      );
    }
    return this.refreshInFlight$;
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

  private saveReturnUrl(url: string): void {
    if (!url || url === '/' || url.startsWith('/forbidden') || url.startsWith('/change-password')) {
      return;
    }
    try {
      sessionStorage.setItem(RETURN_URL_STORAGE_KEY, url);
    } catch {
      // Ignore storage failures (e.g. private browsing) — worst case the user lands on the default route.
    }
  }

  private restoreReturnUrl(): void {
    let returnUrl: string | null;
    try {
      returnUrl = sessionStorage.getItem(RETURN_URL_STORAGE_KEY);
      sessionStorage.removeItem(RETURN_URL_STORAGE_KEY);
    } catch {
      return;
    }
    if (returnUrl && returnUrl !== this.router.url) {
      void this.router.navigateByUrl(returnUrl);
    }
  }
}
