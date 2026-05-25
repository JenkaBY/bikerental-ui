# Task 001: Create `TimeTravelDisplayComponent`

> **Applied Skill:** `angular-component` — standalone leaf component with `OnPush` change detection, signal-based store injection, host bindings for click interaction, and `DatePipe` for locale-aware time formatting

## 1. Objective

Create the `TimeTravelDisplayComponent` that reads `TimeTravelStore.serverTime` signal and renders the formatted time (`dd/MM HH:mm:ss` in UTC) or the fixed-width placeholder `--/-- --:--:--` when no SSE event has arrived. On click (and Enter key), it opens `TimeTravelDialogComponent` via `MatDialog`.

> **Dependency Note:** The import of `TimeTravelDialogComponent` references the file path created in FR-05.
> The `npm run build:shared` validation in this task should be executed **after** FR-05 task-001 is complete.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/components/time-travel-display/time-travel-display.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TimeTravelStore } from '../../../core/state/time-travel.store';
import { TimeTravelDialogComponent } from '../time-travel-dialog/time-travel-dialog.component';
```

**Code to Add/Replace:**

* **Location:** New file; paste the entire content below.

* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { TimeTravelStore } from '../../../core/state/time-travel.store';
import { TimeTravelDialogComponent } from '../time-travel-dialog/time-travel-dialog.component';

@Component({
  selector: 'app-time-travel-display',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="cursor-pointer select-none font-mono tabular-nums text-sm"
      (click)="openDialog()"
    >
      @if (store.serverTime(); as t) {
        {{ t.instant | date: 'dd/MM HH:mm:ss' : 'UTC' }}
      } @else {
        --/-- --:--:--
      }
    </button>
  `,
})
export class TimeTravelDisplayComponent {
  protected readonly store = inject(TimeTravelStore);
  private readonly dialog = inject(MatDialog);

  protected openDialog(): void {
    this.dialog.open(TimeTravelDialogComponent);
  }
}
```

**Key Rules:**

* A native `<button type="button">` provides built-in keyboard accessibility (Enter and Space activation) and correct semantics without any host bindings.
* `DatePipe` with the `'UTC'` timezone argument ensures the displayed time matches the server's UTC clock value rather than the user's local timezone.
* The `@if (store.serverTime(); as t) / @else` block keeps a single element in the DOM at all times; both branches produce a 14-character string so the toolbar width never shifts.
* `TimeTravelDialogComponent` is created in FR-05; this file will not compile until that file exists.

## 4. Validation Steps

skip