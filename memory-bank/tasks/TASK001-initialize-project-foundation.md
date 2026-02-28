# TASK001 - Project Foundation & Angular Material Setup

**Status:** Pending  
**Added:** 2026-02-28  
**Updated:** 2026-02-28  
**Depends on:** None  
**Blocks:** TASK002

## Original Request

Set up the foundational architecture for the bikerental-ui Angular application: install dependencies (Angular Material,
html5-qrcode, @angular/localize), create environment configuration, TypeScript interfaces for all API schemas, all HTTP
API services, global error interceptor, and root routing skeleton with lazy-loaded admin/operator route groups.

## Thought Process

The project scaffold exists but has no real wiring. Before building any UI feature we need:
1. UI library installed and configured (Angular Material + CDK)
2. QR scanning library installed (html5-qrcode)
3. i18n support set up (@angular/localize)
4. Environment files with API base URL
5. `provideHttpClient()` registered in `app.config.ts`
6. `provideAnimationsAsync()` registered for Material animations
7. TypeScript interfaces for all API request/response types (from `docs/api-docs/all.json`)
8. Injectable HTTP services wrapping `HttpClient` for each API domain (7 services)
9. A global error interceptor that handles `ProblemDetail` responses
10. Root routing skeleton with placeholder lazy-loaded route groups for `/admin`, `/operator`, `/login`

The OpenAPI spec at `docs/api-docs/all.json` covers 7 API domains: Customers, Equipment, Equipment Types,
Equipment Statuses, Finance, Rentals, Tariffs. Each domain gets its own model file and service file.

### Key conventions to follow
- All services use `inject(HttpClient)` (not constructor injection)
- All services read `apiUrl` from environment file
- All interfaces exactly match the OpenAPI `components.schemas` section
- Generic `Page<T>` interface for paginated responses
- Services return `Observable<T>` — signals are for components, not services
- Error interceptor parses `ProblemDetail` JSON body and exposes error via a shared signal/service
- The `app.html` template must be replaced — remove the Angular placeholder content, keep only `<router-outlet>`
- The `app.css` must be cleared of placeholder styles

## Implementation Plan

### 1.1 — Install npm dependencies

Run in project root:
```powershell
npm install @angular/material @angular/cdk html5-qrcode
npx ng add @angular/localize --skip-confirmation
```

After install, verify `package.json` includes:
- `@angular/material`
- `@angular/cdk`
- `html5-qrcode`
- `@angular/localize`

### 1.2 — Configure Angular Material theme in angular.json

In `angular.json` → `projects.bikerental-ui.architect.build.options.styles`, add the Material prebuilt theme
**before** `src/styles.css`:

```json
"styles": [
  "@angular/material/prebuilt-themes/indigo-pink.css",
  "src/styles.css"
]
```

Also add Material icon font to `src/index.html` `<head>`:
```html
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
```

### 1.3 — Create environment files

Create `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

Create `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: '/api'  // will be proxied in production
};
```

Update `angular.json` → `build.configurations.production` to add `fileReplacements`:
```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

### 1.4 — Update app.config.ts

Replace contents of `src/app/app.config.ts`:
```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideAnimationsAsync()
  ]
};
```

Note: `authInterceptor` will be added in TASK002. For now, only `errorInterceptor` is registered.

### 1.5 — Clean up app.html and app.css

Replace entire `src/app/app.html` with:
```html
<router-outlet />
```

Replace entire `src/app/app.css` with empty file (or a single comment).

Update `src/app/app.ts` — remove the `title` signal if it serves no purpose. The component should be minimal:
```typescript
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App {}
```

### 1.6 — Create core/models/ — TypeScript interfaces

Create the following files under `src/app/core/models/`. Each file exports interfaces matching the OpenAPI
`components.schemas` section exactly. Use the field names, types, and enums from `docs/api-docs/all.json`.

**`src/app/core/models/common.model.ts`**:
```typescript
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  properties?: Record<string, unknown>;
}

export interface Pageable {
  page?: number;
  size?: number;
  sort?: string[];
}

export interface PageRequest {
  size?: number;
  page?: number;
  sortBy?: string;
}

export interface Page<T> {
  items: T[];
  totalItems: number;
  pageRequest?: PageRequest;
}
```

**`src/app/core/models/customer.model.ts`**:
```typescript
export interface CustomerRequest {
  phone: string;          // required, pattern: ^\+?[0-9\-\s()]+$
  firstName: string;      // required
  lastName: string;       // required
  email?: string;         // format: email
  birthDate?: string;     // format: date (ISO)
  comments?: string;
}

export interface CustomerResponse {
  id: string;             // UUID
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthDate?: string;     // format: date
  comments?: string;
}

export interface CustomerSearchResponse {
  id: string;             // UUID
  phone: string;
  firstName: string;
  lastName: string;
}
```

**`src/app/core/models/equipment.model.ts`**:
```typescript
export interface EquipmentRequest {
  serialNumber: string;   // required, max 50
  uid?: string;           // max 100
  typeSlug?: string;
  statusSlug?: string;
  model?: string;         // max 200
  commissionedAt?: string; // format: date
  condition?: string;
}

export interface EquipmentResponse {
  id: number;
  serialNumber: string;
  uid?: string;
  type?: string;          // slug
  status?: string;        // slug
  model?: string;
  commissionedAt?: string; // format: date
  condition?: string;
}
```

**`src/app/core/models/equipment-type.model.ts`**:
```typescript
export interface EquipmentTypeRequest {
  slug?: string;
  name?: string;
  description?: string;
}

export interface EquipmentTypeResponse {
  slug: string;
  name: string;
  description?: string;
}
```

**`src/app/core/models/equipment-status.model.ts`**:
```typescript
export interface EquipmentStatusRequest {
  slug?: string;
  name?: string;
  description?: string;
  allowedTransitions?: string[];
}

export interface EquipmentStatusResponse {
  slug: string;
  name: string;
  description?: string;
  allowedTransitions?: string[];
}
```

**`src/app/core/models/tariff.model.ts`**:
```typescript
export type TariffStatus = 'ACTIVE' | 'INACTIVE';
export type TariffPeriod = 'HALF_HOUR' | 'HOUR' | 'DAY';

export interface TariffRequest {
  name: string;           // required, max 200
  description?: string;   // max 1000
  equipmentTypeSlug?: string;
  basePrice: number;      // required, min 0
  halfHourPrice: number;  // required, min 0
  hourPrice: number;      // required, min 0
  dayPrice: number;       // required, min 0
  hourDiscountedPrice: number; // required, min 0
  validFrom: string;      // required, format: date
  validTo?: string;       // format: date
  status: TariffStatus;   // required
}

export interface TariffResponse {
  id: number;
  name: string;
  description?: string;
  equipmentTypeSlug?: string;
  basePrice: number;
  halfHourPrice: number;
  hourPrice: number;
  dayPrice: number;
  hourDiscountedPrice: number;
  validFrom: string;
  validTo?: string;
  status: TariffStatus;
}

export interface TariffSelectionResponse {
  id: number;
  name: string;
  equipmentType: string;
  price: number;
  period: TariffPeriod;
}
```

**`src/app/core/models/rental.model.ts`**:
```typescript
export type RentalStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type PatchOp = 'replace' | 'add';

export interface CreateRentalRequest {
  customerId: string;     // UUID, required
  equipmentId: number;    // required
  duration: string;       // ISO-8601 duration, e.g. "PT2H", required
  tariffId?: number;
}

export interface RentalResponse {
  id: number;
  customerId?: string;
  equipmentId?: number;
  tariffId?: number;
  status: string;
  startedAt?: string;
  expectedReturnAt?: string;
  actualReturnAt?: string;
  plannedDurationMinutes?: number;
  actualDurationMinutes?: number;
  estimatedCost?: number;
  finalCost?: number;
}

export interface RentalSummaryResponse {
  id: number;
  customerId?: string;
  equipmentId?: number;
  status: string;
  startedAt?: string;
  expectedReturnAt?: string;
  overdueMinutes?: number;
}

export interface RentalPatchOperation {
  op: PatchOp;
  path: string;
  value?: unknown;
}

export interface RentalUpdateJsonPatchRequest {
  operations: RentalPatchOperation[];
}

export interface ReturnEquipmentRequest {
  rentalId?: number;
  equipmentId?: number;
  equipmentUid?: string;
  paymentMethod?: PaymentMethod;
  operatorId?: string;
}

export interface CostBreakdown {
  baseCost: number;
  overtimeCost: number;
  totalCost: number;
  actualMinutes: number;
  billableMinutes: number;
  plannedMinutes: number;
  overtimeMinutes: number;
  forgivenessApplied: boolean;
  calculationMessage?: string;
}

export interface RentalReturnResponse {
  rental: RentalResponse;
  cost: CostBreakdown;
  additionalPayment: number;
  paymentInfo?: PaymentInfo;
}

export interface PaymentInfo {
  id: string;
  amount: { amount: number };
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'CARD' | 'ELECTRONIC';

export interface RecordPrepaymentRequest {
  amount: number;         // required, min 0.01
  paymentMethod: PaymentMethod; // required
  operatorId: string;     // required
}

export interface PrepaymentResponse {
  paymentId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  createdAt: string;
}
```

**`src/app/core/models/payment.model.ts`**:
```typescript
import { PaymentMethod } from './rental.model';

export type PaymentType = 'PREPAYMENT' | 'ADDITIONAL_PAYMENT' | 'ACCESSORY' | 'OTHER';

export interface RecordPaymentRequest {
  rentalId?: number;
  amount: number;         // required, min 0.01
  paymentType: PaymentType; // required
  paymentMethod: PaymentMethod; // required
  operatorId?: string;
}

export interface RecordPaymentResponse {
  paymentId: string;      // UUID
  receiptNumber: string;
}

export interface PaymentResponse {
  id: string;             // UUID
  rentalId: number;
  amount: number;
  paymentType: string;
  paymentMethod: string;
  createdAt: string;
  operatorId?: string;
  receiptNumber?: string;
}
```

**`src/app/core/models/index.ts`** — re-export all:
```typescript
export * from './common.model';
export * from './customer.model';
export * from './equipment.model';
export * from './equipment-type.model';
export * from './equipment-status.model';
export * from './tariff.model';
export * from './rental.model';
export * from './payment.model';
```

### 1.7 — Create core/api/ — HTTP services

Each service follows the same pattern:
- `@Injectable({ providedIn: 'root' })`
- Private `http = inject(HttpClient)`
- Private `apiUrl = environment.apiUrl`
- Methods return `Observable<T>`
- Method names match the OpenAPI `operationId`

**`src/app/core/api/customer.service.ts`**:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CustomerRequest, CustomerResponse, CustomerSearchResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/customers`;

  searchByPhone(phone: string): Observable<CustomerSearchResponse[]> {
    const params = new HttpParams().set('phone', phone);
    return this.http.get<CustomerSearchResponse[]>(this.baseUrl, { params });
  }

  createCustomer(request: CustomerRequest): Observable<CustomerResponse> {
    return this.http.post<CustomerResponse>(this.baseUrl, request);
  }

  updateCustomer(id: string, request: CustomerRequest): Observable<CustomerResponse> {
    return this.http.put<CustomerResponse>(`${this.baseUrl}/${id}`, request);
  }
}
```

**`src/app/core/api/equipment.service.ts`**:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipmentRequest, EquipmentResponse, Page, Pageable } from '../models';

@Injectable({ providedIn: 'root' })
export class EquipmentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/equipments`;

  search(status?: string, type?: string, pageable?: Pageable): Observable<Page<EquipmentResponse>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (type) params = params.set('type', type);
    if (pageable?.page != null) params = params.set('page', pageable.page);
    if (pageable?.size != null) params = params.set('size', pageable.size);
    if (pageable?.sort) pageable.sort.forEach(s => params = params.append('sort', s));
    return this.http.get<Page<EquipmentResponse>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<EquipmentResponse> {
    return this.http.get<EquipmentResponse>(`${this.baseUrl}/${id}`);
  }

  getByUid(uid: string): Observable<EquipmentResponse> {
    return this.http.get<EquipmentResponse>(`${this.baseUrl}/by-uid/${uid}`);
  }

  getBySerial(serialNumber: string): Observable<EquipmentResponse> {
    return this.http.get<EquipmentResponse>(`${this.baseUrl}/by-serial/${serialNumber}`);
  }

  create(request: EquipmentRequest): Observable<EquipmentResponse> {
    return this.http.post<EquipmentResponse>(this.baseUrl, request);
  }

  update(id: number, request: EquipmentRequest): Observable<EquipmentResponse> {
    return this.http.put<EquipmentResponse>(`${this.baseUrl}/${id}`, request);
  }
}
```

**`src/app/core/api/equipment-type.service.ts`**:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipmentTypeRequest, EquipmentTypeResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class EquipmentTypeService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/equipment-types`;

  getAll(): Observable<EquipmentTypeResponse[]> {
    return this.http.get<EquipmentTypeResponse[]>(this.baseUrl);
  }

  create(request: EquipmentTypeRequest): Observable<EquipmentTypeResponse> {
    return this.http.post<EquipmentTypeResponse>(this.baseUrl, request);
  }

  update(slug: string, request: EquipmentTypeRequest): Observable<EquipmentTypeResponse> {
    return this.http.put<EquipmentTypeResponse>(`${this.baseUrl}/${slug}`, request);
  }
}
```

**`src/app/core/api/equipment-status.service.ts`**:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EquipmentStatusRequest, EquipmentStatusResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class EquipmentStatusService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/equipment-statuses`;

  getAll(): Observable<EquipmentStatusResponse[]> {
    return this.http.get<EquipmentStatusResponse[]>(this.baseUrl);
  }

  create(request: EquipmentStatusRequest): Observable<EquipmentStatusResponse> {
    return this.http.post<EquipmentStatusResponse>(this.baseUrl, request);
  }

  update(slug: string, request: EquipmentStatusRequest): Observable<EquipmentStatusResponse> {
    return this.http.put<EquipmentStatusResponse>(`${this.baseUrl}/${slug}`, request);
  }
}
```

**`src/app/core/api/tariff.service.ts`**:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TariffRequest, TariffResponse, TariffSelectionResponse, Page, Pageable } from '../models';

@Injectable({ providedIn: 'root' })
export class TariffService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/tariffs`;

  getAll(pageable?: Pageable): Observable<Page<TariffResponse>> {
    let params = new HttpParams();
    if (pageable?.page != null) params = params.set('page', pageable.page);
    if (pageable?.size != null) params = params.set('size', pageable.size);
    if (pageable?.sort) pageable.sort.forEach(s => params = params.append('sort', s));
    return this.http.get<Page<TariffResponse>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<TariffResponse> {
    return this.http.get<TariffResponse>(`${this.baseUrl}/${id}`);
  }

  getActive(equipmentType: string): Observable<TariffResponse[]> {
    const params = new HttpParams().set('equipmentType', equipmentType);
    return this.http.get<TariffResponse[]>(`${this.baseUrl}/active`, { params });
  }

  selectTariff(equipmentType: string, durationMinutes: number, rentalDate?: string): Observable<TariffSelectionResponse> {
    let params = new HttpParams()
      .set('equipmentType', equipmentType)
      .set('durationMinutes', durationMinutes);
    if (rentalDate) params = params.set('rentalDate', rentalDate);
    return this.http.get<TariffSelectionResponse>(`${this.baseUrl}/selection`, { params });
  }

  create(request: TariffRequest): Observable<TariffResponse> {
    return this.http.post<TariffResponse>(this.baseUrl, request);
  }

  update(id: number, request: TariffRequest): Observable<TariffResponse> {
    return this.http.put<TariffResponse>(`${this.baseUrl}/${id}`, request);
  }

  activate(id: number): Observable<TariffResponse> {
    return this.http.patch<TariffResponse>(`${this.baseUrl}/${id}/activate`, null);
  }

  deactivate(id: number): Observable<TariffResponse> {
    return this.http.patch<TariffResponse>(`${this.baseUrl}/${id}/deactivate`, null);
  }
}
```

**`src/app/core/api/rental.service.ts`**:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateRentalRequest, RentalResponse, RentalSummaryResponse, RentalUpdateJsonPatchRequest,
  ReturnEquipmentRequest, RentalReturnResponse, RecordPrepaymentRequest, PrepaymentResponse,
  Page, Pageable, RentalStatus
} from '../models';

@Injectable({ providedIn: 'root' })
export class RentalService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/rentals`;

  search(status?: RentalStatus, customerId?: string, equipmentUid?: string, pageable?: Pageable): Observable<Page<RentalSummaryResponse>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (customerId) params = params.set('customerId', customerId);
    if (equipmentUid) params = params.set('equipmentUid', equipmentUid);
    if (pageable?.page != null) params = params.set('page', pageable.page);
    if (pageable?.size != null) params = params.set('size', pageable.size);
    if (pageable?.sort) pageable.sort.forEach(s => params = params.append('sort', s));
    return this.http.get<Page<RentalSummaryResponse>>(this.baseUrl, { params });
  }

  getById(id: number): Observable<RentalResponse> {
    return this.http.get<RentalResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: CreateRentalRequest): Observable<RentalResponse> {
    return this.http.post<RentalResponse>(this.baseUrl, request);
  }

  createDraft(): Observable<RentalResponse> {
    return this.http.post<RentalResponse>(`${this.baseUrl}/draft`, null);
  }

  update(id: number, request: RentalUpdateJsonPatchRequest): Observable<RentalResponse> {
    return this.http.patch<RentalResponse>(`${this.baseUrl}/${id}`, request);
  }

  recordPrepayment(id: number, request: RecordPrepaymentRequest): Observable<PrepaymentResponse> {
    return this.http.post<PrepaymentResponse>(`${this.baseUrl}/${id}/prepayments`, request);
  }

  returnEquipment(request: ReturnEquipmentRequest): Observable<RentalReturnResponse> {
    return this.http.post<RentalReturnResponse>(`${this.baseUrl}/return`, request);
  }
}
```

**`src/app/core/api/payment.service.ts`**:
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RecordPaymentRequest, RecordPaymentResponse, PaymentResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/payments`;

  getById(id: string): Observable<PaymentResponse> {
    return this.http.get<PaymentResponse>(`${this.baseUrl}/${id}`);
  }

  getByRental(rentalId: number): Observable<PaymentResponse[]> {
    return this.http.get<PaymentResponse[]>(`${this.baseUrl}/by-rental/${rentalId}`);
  }

  record(request: RecordPaymentRequest): Observable<RecordPaymentResponse> {
    return this.http.post<RecordPaymentResponse>(this.baseUrl, request);
  }
}
```

### 1.8 — Create error interceptor

Create `src/app/core/interceptors/error.interceptor.ts`:
```typescript
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ErrorService } from './error.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.error && typeof error.error === 'object' && 'title' in error.error) {
        // ProblemDetail response
        errorService.setError({
          title: error.error.title ?? 'Error',
          detail: error.error.detail ?? '',
          status: error.error.status ?? error.status
        });
      } else {
        errorService.setError({
          title: `HTTP Error ${error.status}`,
          detail: error.message,
          status: error.status
        });
      }
      return throwError(() => error);
    })
  );
};
```

Create `src/app/core/interceptors/error.service.ts`:
```typescript
import { Injectable, signal } from '@angular/core';

export interface AppError {
  title: string;
  detail: string;
  status: number;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly lastError = signal<AppError | null>(null);

  setError(error: AppError): void {
    this.lastError.set(error);
  }

  clearError(): void {
    this.lastError.set(null);
  }
}
```

### 1.9 — Create root routing skeleton

Replace `src/app/app.routes.ts`:
```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES)
  },
  {
    path: 'operator',
    loadChildren: () => import('./features/operator/operator.routes').then(m => m.OPERATOR_ROUTES)
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
```

Create placeholder route files so the app compiles:

**`src/app/features/auth/login.component.ts`** — minimal placeholder:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  standalone: true,
  template: '<p>Login placeholder — TASK002</p>'
})
export class LoginComponent {}
```

**`src/app/features/admin/admin.routes.ts`** — minimal placeholder:
```typescript
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'equipment', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () => import('./layout/admin-placeholder.component').then(m => m.AdminPlaceholderComponent)
  }
];
```

**`src/app/features/admin/layout/admin-placeholder.component.ts`**:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-admin-placeholder',
  standalone: true,
  template: '<p>Admin module placeholder — TASK003</p>'
})
export class AdminPlaceholderComponent {}
```

**`src/app/features/operator/operator.routes.ts`** — minimal placeholder:
```typescript
import { Routes } from '@angular/router';

export const OPERATOR_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: '**',
    loadComponent: () => import('./layout/operator-placeholder.component').then(m => m.OperatorPlaceholderComponent)
  }
];
```

**`src/app/features/operator/layout/operator-placeholder.component.ts`**:
```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-operator-placeholder',
  standalone: true,
  template: '<p>Operator module placeholder — TASK004</p>'
})
export class OperatorPlaceholderComponent {}
```

### 1.10 — Verify build and tests

Run:
```powershell
npm run build
npm test
```

Fix any compilation errors. Ensure all new files are properly imported and exported.

## Progress Tracking

**Overall Status:** Not Started - 0%

### Subtasks

| ID | Description | Status | Updated | Notes |
|----|-------------|--------|---------|-------|
| 1.1 | Install npm dependencies (Material, CDK, html5-qrcode, localize) | Not Started | 2026-02-28 | |
| 1.2 | Configure Material theme in angular.json + icon font | Not Started | 2026-02-28 | |
| 1.3 | Create environment files | Not Started | 2026-02-28 | |
| 1.4 | Update app.config.ts (provideHttpClient, provideAnimationsAsync) | Not Started | 2026-02-28 | |
| 1.5 | Clean up app.html, app.css, app.ts | Not Started | 2026-02-28 | Remove Angular placeholder |
| 1.6 | Create core/models/ — all TypeScript interfaces | Not Started | 2026-02-28 | 8 model files + index |
| 1.7 | Create core/api/ — all HTTP services | Not Started | 2026-02-28 | 7 service files |
| 1.8 | Create error interceptor + ErrorService | Not Started | 2026-02-28 | |
| 1.9 | Create root routing skeleton + placeholder components | Not Started | 2026-02-28 | |
| 1.10 | Verify build and tests | Not Started | 2026-02-28 | |

## Progress Log

### 2026-02-28

- Task created during memory bank initialization
- Reworked to include Angular Material, html5-qrcode, @angular/localize, auth interceptor slot
- Full code provided for all models, services, and interceptor

