# Task 007: Relocate Operator Test Spec Files

> **Applied Skill:** `angular-testing` — `TestBed`, `vi.fn()`, token providers as value providers.

## 1. Objective

Create all four relocated spec files in `projects/operator/src/app/layout/`. Each file's relative imports (`'../../../app.tokens'`, `'../../../core/layout-mode.service'`) are replaced with `@bikerental/shared`. Intra-layout relative imports (e.g., `./operator-shell-wrapper.component`) remain unchanged.

## 2. Files to Create

| # | File Path                                                                            | Action          |
|---|--------------------------------------------------------------------------------------|-----------------|
| 1 | `projects/operator/src/app/layout/operator-layout.component.spec.ts`                 | Create New File |
| 2 | `projects/operator/src/app/layout/operator-layout.component.handlers.spec.ts`        | Create New File |
| 3 | `projects/operator/src/app/layout/operator-shell-wrapper.component.spec.ts`          | Create New File |
| 4 | `projects/operator/src/app/layout/operator-shell-wrapper.component.handlers.spec.ts` | Create New File |

---

## 3. Code Implementation

### File 1 — `projects/operator/src/app/layout/operator-layout.component.spec.ts`

**Import changes from source** (`src/app/features/operator/layout/operator-layout.component.spec.ts`):

| Old import path         | New import path      |
|-------------------------|----------------------|
| `'../../../app.tokens'` | `@bikerental/shared` |

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OperatorLayoutComponent } from './operator-layout.component';
import { APP_BRAND, BRAND } from '@bikerental/shared';

describe('OperatorLayoutComponent', () => {
  let fixture: ComponentFixture<OperatorLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorLayoutComponent],
      providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorLayoutComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the toolbar', () => {
    expect(fixture.nativeElement.querySelector('app-toolbar')).toBeTruthy();
  });

  it('should render the bottom nav', () => {
    expect(fixture.nativeElement.querySelector('app-bottom-nav')).toBeTruthy();
  });

  it('should render a main content area', () => {
    expect(fixture.nativeElement.querySelector('main')).toBeTruthy();
  });

  it('should render exactly 3 bottom nav items', () => {
    const links = fixture.nativeElement.querySelectorAll('app-bottom-nav a');
    expect(links.length).toBe(3);
  });

  it('should render the health indicator in the toolbar', () => {
    expect(fixture.nativeElement.querySelector('app-health-indicator')).toBeTruthy();
  });

  it('should render the logout button in the toolbar', () => {
    expect(fixture.nativeElement.querySelector('app-logout-button')).toBeTruthy();
  });

  it('toolbar should not have a sidebar toggle button', () => {
    const toggleBtn = fixture.nativeElement.querySelector('app-toggle-button');
    expect(toggleBtn).toBeFalsy();
  });

  it('host element should have h-screen class', () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.classList).toContain('h-screen');
  });
});
```

### File 2 — `projects/operator/src/app/layout/operator-layout.component.handlers.spec.ts`

**Import changes from source** (`src/app/features/operator/layout/operator-layout.component.handlers.spec.ts`):

| Old import path         | New import path      |
|-------------------------|----------------------|
| `'../../../app.tokens'` | `@bikerental/shared` |

```typescript
import { TestBed } from '@angular/core/testing';
import { OperatorLayoutComponent } from './operator-layout.component';
import { APP_BRAND, BRAND } from '@bikerental/shared';

describe('OperatorLayoutComponent handlers', () => {
  it('onLogout logs a message', async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorLayoutComponent],
      providers: [{ provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();
    const fixture = TestBed.createComponent(OperatorLayoutComponent);
    const comp = fixture.componentInstance;
    const spy = vi.spyOn(console, 'log');
    (comp as unknown as { onLogout: () => void }).onLogout();
    expect(spy).toHaveBeenCalledWith('logout requested from operator layout');
  });
});
```

### File 3 — `projects/operator/src/app/layout/operator-shell-wrapper.component.spec.ts`

**Import changes from source** (`src/app/features/operator/layout/operator-shell-wrapper.component.spec.ts`):

| Old import path                       | New import path      |
|---------------------------------------|----------------------|
| `'../../../core/layout-mode.service'` | `@bikerental/shared` |
| `'../../../app.tokens'`               | `@bikerental/shared` |

```typescript
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OperatorShellWrapperComponent } from './operator-shell-wrapper.component';
import { LayoutModeService, APP_BRAND, BRAND } from '@bikerental/shared';

describe('OperatorShellWrapperComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorShellWrapperComponent],
      providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();
  });

  it('renders operator layout when mobile', () => {
    const svc = TestBed.inject(LayoutModeService);
    svc.setMode('mobile');
    const fixture = TestBed.createComponent(OperatorShellWrapperComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-operator-layout')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-shell')).toBeFalsy();
  });

  it('renders shell when desktop', () => {
    const svc = TestBed.inject(LayoutModeService);
    svc.setMode('desktop');
    const fixture = TestBed.createComponent(OperatorShellWrapperComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-shell')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-operator-layout')).toBeFalsy();
  });
});
```

### File 4 — `projects/operator/src/app/layout/operator-shell-wrapper.component.handlers.spec.ts`

**Import changes from source** (`src/app/features/operator/layout/operator-shell-wrapper.component.handlers.spec.ts`):

| Old import path         | New import path      |
|-------------------------|----------------------|
| `'../../../app.tokens'` | `@bikerental/shared` |

```typescript
import { TestBed } from '@angular/core/testing';
import { OperatorShellWrapperComponent } from './operator-shell-wrapper.component';
import { provideRouter } from '@angular/router';
import { APP_BRAND, BRAND } from '@bikerental/shared';

describe('OperatorShellWrapperComponent handlers', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OperatorShellWrapperComponent],
      providers: [provideRouter([]), { provide: APP_BRAND, useValue: BRAND }],
    }).compileComponents();
  });

  it('onLogout logs a message', () => {
    const fixture = TestBed.createComponent(OperatorShellWrapperComponent);
    const comp = fixture.componentInstance;
    const spy = vi.spyOn(console, 'log');
    (comp as unknown as { onLogout: () => void }).onLogout();
    expect(spy).toHaveBeenCalledWith('logout from operator wrapper');
  });
});
```

---

## 4. Validation Steps

```powershell
# TypeScript spec parse-check — zero errors expected
npx tsc -p projects/operator/tsconfig.spec.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: **no output** (zero TypeScript errors in spec files).

```powershell
# Run operator unit tests — all 13 tests must pass
npx ng test operator --watch=false
```

Expected: `13 passed`, `0 failed`.
