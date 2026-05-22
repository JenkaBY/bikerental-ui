# Task 003: Guard Time-Travel Widget Slot in `AppToolbarComponent`

> **Applied Skill:** `angular-component` skill — OnPush standalone component extended with a signal-ready protected field and a named `<ng-content>` projection slot wrapped in Angular's `@if` control-flow syntax; follows the existing `environment` direct-import pattern established in `health-poller.service.ts` and `health.service.ts`

## 1. Objective

Extend `AppToolbarComponent` to:

1. Read `timeTravelEnabled` from the shared `environment` object.
2. Expose it as a `protected` class field so the template can reference it.
3. Add a **named** `<ng-content select="[timeTravelWidget]">` projection slot in the template, wrapped in `@if (timeTravelEnabled)`, so the time-travel widget (added in FR-04) is **completely absent from the DOM** when the flag is `false`. The existing unnamed `<ng-content>` (used for logout button, etc.) is left intact.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/components/app-toolbar/app-toolbar.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

```typescript
import { environment } from '../../../environments/environment';
```

Add this import below the existing Angular / Material import block (after the last `import` statement currently in the file).

---

**Code to Add/Replace:**

### 3a. Add `timeTravelEnabled` protected field to the class

* **Location:** Inside the `AppToolbarComponent` class body, add the field as the **first** line of the class body, before `title = input.required<string>();`.

* **Snippet (line to add):**

```typescript
  protected readonly timeTravelEnabled = environment.timeTravelEnabled;
```

---

### 3b. Add named projection slot for the time-travel widget

* **Location:** In the `template`, place the new `@if` / `<ng-content>` block immediately **before** the existing unnamed `<ng-content></ng-content>` tag (which is the last element inside `<mat-toolbar>`).

* **Snippet (replace the closing section of the template):**

Replace:

```html
      <ng-content></ng-content>
    </mat-toolbar>
  `,
```

With:

```html
      @if (timeTravelEnabled) {
        <ng-content select="[timeTravelWidget]"></ng-content>
      }

      <ng-content></ng-content>
    </mat-toolbar>
  `,
```

---

### 3c. Full resulting file (for reference — do not blindly copy-paste; apply only the two changes above)

```typescript
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';
import { LayoutModeToggleComponent } from '../layout-mode-toggle/layout-mode-toggle.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    ToggleButtonComponent,
    LayoutModeToggleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar
      color="primary"
      class="sticky top-0 z-20 shrink-0 flex items-center gap-2 px-4 shadow-md h-14 min-w-0"
    >
      @if (showToggle()) {
        <app-toggle-button
          [pressed]="menuOpen()"
          (toggled)="toggleSidebar.emit()"
          [showText]="false"
        ></app-toggle-button>
      }

      <span
        class="text-base font-medium truncate flex-1 min-w-0 hover:cursor-pointer focus:outline-none"
        (click)="goHome()"
        tabindex="0"
        role="button"
        (keyup.enter)="goHome()"
        (keyup.space)="goHome()"
        (keydown.space)="$event.preventDefault()"
      >
        {{ title() }}
      </span>

      @if (showDesktopModeToggle()) {
        <app-layout-mode-toggle></app-layout-mode-toggle>
      }

      @if (timeTravelEnabled) {
        <ng-content select="[timeTravelWidget]"></ng-content>
      }

      <ng-content></ng-content>
    </mat-toolbar>
  `,
})
export class AppToolbarComponent {
  protected readonly timeTravelEnabled = environment.timeTravelEnabled;

  title = input.required<string>();

  showToggle = input<boolean>(true);

  menuOpen = input<boolean>(false);

  showLogout = input<boolean>(true);

  showDesktopModeToggle = input<boolean>(false);

  toggleSidebar = output<void>();

  logout = output<void>();

  private router = inject(Router);

  goHome(): void {
    void this.router.navigate(['/']);
  }
}
```

## 4. Validation Steps

skip
