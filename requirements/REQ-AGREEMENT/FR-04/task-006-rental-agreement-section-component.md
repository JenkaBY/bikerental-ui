# Task 006: RentalAgreementSectionComponent (dumb section)

> **Applied Skill:** `angular-component` (standalone, OnPush, `input()`/`output()` signal
> functions, dumb component — no store injection, transient state comes entirely from inputs per
> the project convention that transient UI state lives in the store, not the component) —
> implements FR-04 design section 3, bullet 4.

## 1. Objective

Create `RentalAgreementSectionComponent`, a dumb standalone section that renders the signed
agreement summary (signed-at date, template version) and a "Download PDF" button, styled like the
existing `rental-cost-section.component.ts` bordered section pattern.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-agreement-section.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels, type RentalSignatureSummary } from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels, type RentalSignatureSummary } from '@bikerental/shared';

@Component({
  selector: 'app-rental-agreement-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="px-4 py-3 border border-slate-200 rounded-lg mx-4 my-2 flex items-center gap-3">
      <mat-icon class="!text-green-600">description</mat-icon>
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium text-slate-800">
          {{ Labels.AgreementSigned }} {{ summary().signedAt | date: 'short' }}
        </p>
        <p class="text-xs text-slate-500">
          {{ Labels.AgreementVersion }} {{ summary().templateVersionNumber }}
        </p>
      </div>
      <button
        mat-stroked-button
        [disabled]="isDownloading()"
        (click)="downloadRequested.emit()"
      >
        @if (isDownloading()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ Labels.DownloadAgreementPdf }}
        }
      </button>
    </div>
  `,
})
export class RentalAgreementSectionComponent {
  readonly summary = input.required<RentalSignatureSummary>();
  readonly isDownloading = input(false);

  readonly downloadRequested = output<void>();

  protected readonly Labels = Labels;
}
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build operator --configuration development
npx ng lint operator
```
