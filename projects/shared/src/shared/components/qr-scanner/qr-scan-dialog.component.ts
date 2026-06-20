import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Labels } from '../../constant/labels';
import { CancelButtonComponent } from '../cancel-button/cancel-button.component';
import { QrScannerComponent, QrScanError } from './qr-scanner.component';

export interface QrScanDialogData {
  title?: string;
}

@Component({
  selector: 'app-qr-scan-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, QrScannerComponent, CancelButtonComponent],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>

    <mat-dialog-content>
      @if (error()) {
        <p class="py-4 text-sm text-slate-600">{{ errorMessage() }}</p>
      } @else {
        <app-qr-scanner (scanned)="onScanned($event)" (scanError)="error.set($event)" />
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <app-form-cancel-button />
    </mat-dialog-actions>
  `,
})
export class QrScanDialogComponent {
  private readonly data = inject<QrScanDialogData | null>(MAT_DIALOG_DATA, { optional: true });
  private readonly dialogRef = inject<MatDialogRef<QrScanDialogComponent, string>>(MatDialogRef);

  protected readonly title = this.data?.title ?? Labels.ScanEquipmentTitle;
  protected readonly error = signal<QrScanError | null>(null);

  protected readonly errorMessage = computed(() => {
    switch (this.error()) {
      case 'permission-denied':
        return Labels.CameraPermissionDenied;
      case 'no-camera':
        return Labels.NoCameraFound;
      default:
        return Labels.ScannerError;
    }
  });

  protected onScanned(uid: string): void {
    this.dialogRef.close(uid);
  }
}
