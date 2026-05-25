# Task 002: Restructure `AppToolbarComponent` to Three-Region Layout

> **Applied Skill:** `angular-component` — modifying an existing standalone component; restructuring a flat flex layout to a three-region (left `flex-1` | center | right `flex-1`) model; replacing `ng-content` slot with a direct component embed

## 1. Objective

Update `AppToolbarComponent` to:

1. Import and embed `TimeTravelDisplayComponent` in place of the `ng-content select="[timeTravelWidget]"` slot.
2. Restructure the toolbar from a flat flex row to three regions so the time display sits in the visual centre regardless of left/right content width.
3. Keep all existing inputs, outputs, and projected `<ng-content>` for toolbar actions unchanged.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/components/app-toolbar/app-toolbar.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

Add `TimeTravelStore` and `TimeTravelDisplayComponent` to the TypeScript import list and add `TimeTravelDisplayComponent` to the component's `imports` array:

```typescript
import { TimeTravelStore } from '../../../core/state/time-travel.store';
import { TimeTravelDisplayComponent } from '../time-travel-display/time-travel-display.component';
```

**Code to Add/Replace:**

* **Location:** Replace the entire file content with the snippet below. The class fields (`title`, `showToggle`, `menuOpen`, `showLogout`, `showDesktopModeToggle`, `toggleSidebar`, `logout`) are unchanged; only the `imports` array and `template` are modified.

* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ToggleButtonComponent } from '../toggle-button/toggle-button.component';
import { LayoutModeToggleComponent } from '../layout-mode-toggle/layout-mode-toggle.component';
import { TimeTravelStore } from '../../../core/state/time-travel.store';
import { TimeTravelDisplayComponent } from '../time-travel-display/time-travel-display.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    ToggleButtonComponent,
    LayoutModeToggleComponent,
    TimeTravelDisplayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar
      color="primary"
      class="sticky top-0 z-20 shrink-0 flex items-center px-4 shadow-md h-14 min-w-0"
    >
      <div class="flex-1 flex items-center gap-2 min-w-0">
        @if (showToggle()) {
          <app-toggle-button
            [pressed]="menuOpen()"
            (toggled)="toggleSidebar.emit()"
            [showText]="false"
          ></app-toggle-button>
        }

        <span
          class="text-base font-medium truncate min-w-0 hover:cursor-pointer focus:outline-none"
          (click)="goHome()"
          tabindex="0"
          role="button"
          (keyup.enter)="goHome()"
          (keyup.space)="goHome()"
          (keydown.space)="$event.preventDefault()"
        >
          {{ title() }}
        </span>
      </div>

      @if (timeTravelStore.timeTravelEnabled) {
        <app-time-travel-display />
      }

      <div class="flex-1 flex items-center justify-end gap-2">
        @if (showDesktopModeToggle()) {
          <app-layout-mode-toggle></app-layout-mode-toggle>
        }
        <ng-content></ng-content>
      </div>
    </mat-toolbar>
  `,
})
export class AppToolbarComponent {
  protected readonly timeTravelStore = inject(TimeTravelStore);

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

**Key Layout Changes:**

* The toolbar `mat-toolbar` outer class loses `gap-2` (gaps are now managed by the inner flex containers).
* The **left region** `<div class="flex-1 flex items-center gap-2 min-w-0">` wraps the toggle button and title span. The title span no longer needs `flex-1` — the parent div claims it instead.
* The **centre** `@if (timeTravelStore.timeTravelEnabled)` renders `<app-time-travel-display />` directly — the old `ng-content select="[timeTravelWidget]"` slot is removed. The flag is read from the injected `TimeTravelStore` (populated from `environment` in FR-03) so the toolbar and the display component share a single source of truth.
* The **right region** `<div class="flex-1 flex items-center justify-end gap-2">` wraps the desktop-mode toggle and the default `<ng-content>` (toolbar action buttons projected by each host layout). `justify-end` ensures action buttons are right-aligned.

## 4. Validation Steps

skip
