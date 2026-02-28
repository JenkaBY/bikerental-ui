# TASK002 - Authentication: Service, Interceptor, Guards, Login Page

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** TASK001  
**Blocks:** TASK003, TASK004

## Original Request

Build the complete authentication layer for the application. Since the backend login endpoint (`POST /api/auth/login`)
does not exist yet, create `AuthService` with a **mock login** that accepts any credentials and returns a hardcoded JWT
with a role claim. Build the auth interceptor that attaches the Bearer token to every API request. Build route guards
for authentication and role-based access. Build the Login page with Angular Material.

## Thought Process

The authentication layer is the critical path — every other module depends on it because:
1. All API calls require `Authorization: Bearer <token>` header
2. Admin and operator routes need guards to prevent unauthorized access
3. The login page is the entry point for all users
4. Role-based routing determines where users land after login

**Mock strategy**: The `AuthService.login()` method will NOT call a real HTTP endpoint. Instead it will:
- Accept `{ username, password }` as input
- Check hardcoded credentials (e.g. `admin/admin` → ADMIN role, `operator/operator` → OPERATOR role)
- Generate a fake JWT-like token string and store it in `localStorage`
- Parse the stored token to restore state on page refresh

When the real `POST /api/auth/login` endpoint becomes available, only the `login()` method body needs to change.
The rest of the auth system (interceptor, guards, service signals) remains the same.

**Token structure**: We store a simple JSON object in `localStorage` under key `auth_token`:
```json
{ "token": "mock-jwt-xxx", "username": "admin", "role": "ADMIN" }
```

**Interceptor behavior**:
- Read token from `AuthService.token()` signal
- If token exists, clone request with `Authorization: Bearer ${token}` header
- If response is `401 Unauthorized`, call `AuthService.logout()` and navigate to `/login`
- Skip adding header for the login request itself (URL contains `/api/auth/login`)

**Guard behavior**:
- `authGuard`: if `AuthService.isAuthenticated()` is false → redirect to `/login`
- `roleGuard(['ADMIN'])`: if authenticated but role not in allowed list → redirect to `/` (which will re-evaluate)

## Implementation Plan

### 2.1 — Create auth model interfaces

Create `src/app/core/auth/auth.model.ts`:
```typescript
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: UserRole;
}

export type UserRole = 'ADMIN' | 'OPERATOR';

export interface UserInfo {
  username: string;
  role: UserRole;
}
```

### 2.2 — Create AuthService

Create `src/app/core/auth/auth.service.ts`:

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of, throwError, delay } from 'rxjs';
import { inject } from '@angular/core';
import { LoginRequest, LoginResponse, UserInfo, UserRole } from './auth.model';

const STORAGE_KEY = 'auth_token';

// Mock credentials — remove when real endpoint is available
const MOCK_USERS: Record<string, { password: string; role: UserRole }> = {
  admin: { password: 'admin', role: 'ADMIN' },
  operator: { password: 'operator', role: 'OPERATOR' }
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  private readonly _currentUser = signal<UserInfo | null>(this.loadFromStorage());
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly token = computed(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try { return JSON.parse(stored).token as string; } catch { return null; }
  });

  /**
   * Mock login — accepts hardcoded credentials.
   * Replace body with HTTP call when POST /api/auth/login is available.
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    const user = MOCK_USERS[request.username];
    if (!user || user.password !== request.password) {
      return throwError(() => new Error('Invalid credentials'));
    }
    const response: LoginResponse = {
      token: `mock-jwt-${request.username}-${Date.now()}`,
      username: request.username,
      role: user.role
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(response));
    this._currentUser.set({ username: response.username, role: response.role });
    return of(response).pipe(delay(300)); // simulate network delay
  }

  logout(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private loadFromStorage(): UserInfo | null {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
      const parsed = JSON.parse(stored) as LoginResponse;
      return { username: parsed.username, role: parsed.role };
    } catch {
      return null;
    }
  }
}
```

### 2.3 — Create auth interceptor

Create `src/app/core/auth/auth.interceptor.ts`:
```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  // Don't add auth header to login requests
  if (req.url.includes('/api/auth/login')) {
    return next(req);
  }

  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
      }
      return throwError(() => error);
    })
  );
};
```

### 2.4 — Create auth guard

Create `src/app/core/auth/auth.guard.ts`:
```typescript
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
```

### 2.5 — Create role guard

Create `src/app/core/auth/role.guard.ts`:
```typescript
import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { UserRole } from './auth.model';

export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (!user) {
      return router.createUrlTree(['/login']);
    }
    if (!allowedRoles.includes(user.role)) {
      // User is authenticated but does not have the required role.
      // Redirect to their appropriate home page.
      if (user.role === 'ADMIN') {
        return router.createUrlTree(['/admin']);
      }
      return router.createUrlTree(['/operator']);
    }
    return true;
  };
}
```

### 2.6 — Register authInterceptor in app.config.ts

Update `src/app/app.config.ts` — add `authInterceptor` to `withInterceptors` array **before** `errorInterceptor`:
```typescript
import { authInterceptor } from './core/auth/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

// in providers:
provideHttpClient(withInterceptors([authInterceptor, errorInterceptor]))
```

### 2.7 — Build Login page component

Create `src/app/features/auth/login.component.ts`:

This is a standalone component with:
- Angular Material imports: `MatCardModule`, `MatFormFieldModule`, `MatInputModule`, `MatButtonModule`, `MatIconModule`
- `ReactiveFormsModule` for the login form
- Reactive form with `username` (required) and `password` (required) controls
- `loading` signal and `errorMessage` signal for UI state
- On submit: call `AuthService.login()`, on success navigate based on role, on error show message
- `OnPush` change detection

Template (`login.component.html`):
- Centered layout (flexbox, full viewport height)
- `mat-card` with title "Bike Rental"
- `mat-form-field` for username with `mat-icon` prefix "person"
- `mat-form-field` for password with `mat-icon` prefix "lock" and visibility toggle
- `mat-error` messages for required fields
- `<button mat-raised-button color="primary">` submit button with loading state
- Error message `<p>` shown when `errorMessage()` is set

Styles (`login.component.css`):
- Host: `display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;`
- Card: `width: 100%; max-width: 400px; padding: 32px;`
- Form: `display: flex; flex-direction: column; gap: 16px;`

### 2.8 — Update app.routes.ts with guards

Replace `src/app/app.routes.ts` to add auth and role guards:
```typescript
import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'operator',
    canActivate: [authGuard, roleGuard(['OPERATOR', 'ADMIN'])],
    loadChildren: () => import('./features/operator/operator.routes').then(m => m.OPERATOR_ROUTES)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
```

### 2.9 — Verify build and test

Run:
```powershell
npm run build
npm test
```

Test manually:
- Navigate to `http://localhost:4200` → should redirect to `/login`
- Login with `admin/admin` → should redirect to `/admin`
- Login with `operator/operator` → should redirect to `/operator`
- Navigate to `/admin` without auth → should redirect to `/login`
- Navigate to `/operator` as admin → should work (admin has access)

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 2.1 | Auth model interfaces | Not Started | 2026-02-28 | |
| 2.2 | AuthService (mock JWT) | Not Started | 2026-02-28 | |
| 2.3 | Auth interceptor | Not Started | 2026-02-28 | |
| 2.4 | Auth guard | Not Started | 2026-02-28 | |
| 2.5 | Role guard | Not Started | 2026-02-28 | |
| 2.6 | Register authInterceptor in app.config.ts | Not Started | 2026-02-28 | |
| 2.7 | Login page component (Material) | Not Started | 2026-02-28 | |
| 2.8 | Update app.routes.ts with guards | Not Started | 2026-02-28 | |
| 2.9 | Verify build and test | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created with full implementation details
- Mock login strategy decided: hardcoded credentials, localStorage storage
- Auth interceptor, guard, and role guard patterns designed

