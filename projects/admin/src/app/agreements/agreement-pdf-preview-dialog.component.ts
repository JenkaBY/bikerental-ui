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
