# Task 003: `OperatorLayoutComponent` hides the bottom nav on `fullScreen` routes

> **Applied Skill:** `angular-routing` - route `data` flag read from the deepest activated snapshot after every `NavigationEnd`. `angular-signals` - `toSignal` over router events (no manual subscribe). `angular-component` - OnPush, no new state fields besides the derived signal. Toolbar and point switcher stay untouched. Lives in the operator project only.

## 1. Objective

* Helper `isFullScreenRoute(root)` returns `true` when the deepest child snapshot has `data['fullScreen'] === true`.
* Layout exposes `hideBottomNav` and renders `<app-bottom-nav>` only when it is `false`.

No route sets the flag yet (task 009 does), so behaviour is unchanged after this task.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/layout/full-screen-route.ts` - **Action:** Create New File
* **File Path:** `projects/operator/src/app/layout/operator-layout.component.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - `full-screen-route.ts`, whole content:**

```typescript
import type { ActivatedRouteSnapshot } from '@angular/router';

export function isFullScreenRoute(root: ActivatedRouteSnapshot): boolean {
  let route = root;
  while (route.firstChild) {
    route = route.firstChild;
  }
  return route.data['fullScreen'] === true;
}
```

**Step 2 - `operator-layout.component.ts`, imports.**

Replace
`import { takeUntilDestroyed } from '@angular/core/rxjs-interop';`
with
`import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';`

Replace
`import { RouterOutlet } from '@angular/router';`
with
```typescript
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
```

Add directly below the line `import { PointSwitchRefreshService } from '../core/point-switch-refresh.service';`:

```typescript
import { isFullScreenRoute } from './full-screen-route';
```

**Step 3 - template.** Replace
`    <app-bottom-nav [items]="navItems" />`
with
```html
    @if (!hideBottomNav()) {
      <app-bottom-nav [items]="navItems" />
    }
```

**Step 4 - class.** Directly below the line `private readonly destroyRef = inject(DestroyRef);` add:

```typescript
  private readonly router = inject(Router);
  protected readonly hideBottomNav = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => isFullScreenRoute(this.router.routerState.snapshot.root)),
    ),
    { initialValue: isFullScreenRoute(this.router.routerState.snapshot.root) },
  );
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/layout/full-screen-route.ts projects/operator/src/app/layout/operator-layout.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
