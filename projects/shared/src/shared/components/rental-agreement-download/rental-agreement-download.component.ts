import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RentalSignatureStore } from '../../../core/state/rental-signature.store';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-rental-agreement-download',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    @if (store.summary()) {
      <button
        mat-icon-button
        class="icon-btn-sm shrink-0"
        [disabled]="store.isDownloading()"
        [attr.aria-label]="Labels.AgreementPdf"
        [title]="Labels.AgreementPdf"
        (click)="store.downloadPdf(rentalId())"
      >
        @if (store.isDownloading()) {
          <mat-spinner diameter="18" />
        } @else {
          <mat-icon>picture_as_pdf</mat-icon>
        }
      </button>
    }
  `,
})
export class RentalAgreementDownloadComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(RentalSignatureStore);

  readonly rentalId = input.required<number>();
}
