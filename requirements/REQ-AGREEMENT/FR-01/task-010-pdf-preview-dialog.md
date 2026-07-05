# Task 010: Agreement PDF Preview Dialog

> **Applied Skills:** `angular-component` (standalone, `OnPush`, `inject()`, `DestroyRef` cleanup
> lifecycle), `angular-di` (`DomSanitizer` injected via `inject()`) — renders a backend-produced
> PDF `Blob` in an iframe with a download fallback, per FR-01's design section 3
> (`agreement-pdf-preview-dialog.component.ts` bullet). Exactly one object URL is created per
> dialog instance and revoked on destroy.

## 1. Objective

Create `AgreementPdfPreviewDialogComponent`: receives `{ blob: Blob; fileName: string }` via
`MAT_DIALOG_DATA`, creates one `URL.createObjectURL(blob)`, sanitizes it with
`DomSanitizer.bypassSecurityTrustResourceUrl` for an `<iframe>`, offers a "Download" anchor
fallback, and revokes the object URL in `DestroyRef.onDestroy`.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/agreements/agreement-pdf-preview-dialog.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Labels } from '@bikerental/shared';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Labels } from '@bikerental/shared';

export interface AgreementPdfPreviewDialogData {
  blob: Blob;
  fileName: string;
}

@Component({
  selector: 'app-agreement-pdf-preview-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ Labels.AgreementPdfPreviewDialogTitle }}</h2>
    <mat-dialog-content class="!p-0 h-[70vh]">
      <iframe [src]="previewUrl" class="w-full h-full border-0" title="Agreement PDF preview">
      </iframe>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <a mat-button [href]="objectUrl" [download]="data.fileName">{{ Labels.DownloadPdfButton }}</a>
      <button mat-flat-button color="primary" (click)="close()">{{ Labels.Close }}</button>
    </mat-dialog-actions>
  `,
})
export class AgreementPdfPreviewDialogComponent {
  protected readonly Labels = Labels;
  protected readonly data = inject<AgreementPdfPreviewDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject(MatDialogRef<AgreementPdfPreviewDialogComponent>);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly objectUrl = URL.createObjectURL(this.data.blob);
  protected readonly previewUrl: SafeResourceUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
    this.objectUrl,
  );

  constructor() {
    this.destroyRef.onDestroy(() => URL.revokeObjectURL(this.objectUrl));
  }

  close(): void {
    this.dialogRef.close();
  }
}
```

**Note on dialog size:** open this dialog with `width: '80vw', maxWidth: '900px', height: '85vh'`
from the caller (Task 011) — the component itself does not set its own dialog config.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build admin --configuration development
npx ng lint admin
```
