import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  AgreementSigningStore,
  ApiError,
  ApiErrorParser,
  DurationPipe,
  ErrorCode,
  Labels,
  MoneyPipe,
  NotificationService,
  RentalStore,
  resolveErrorMessage,
  SignaturePadComponent,
} from '@bikerental/shared';

export interface SigningDialogData {
  rentalId: number;
  version: number;
}

export type SigningDialogResult = 'signed' | 'cancelled' | { error: ApiError };

@Component({
  selector: 'app-signing-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DatePipe,
    DurationPipe,
    MoneyPipe,
    SignaturePadComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.SigningDialogTitle }}</h2>
    <mat-dialog-content class="flex flex-col gap-4">
      @if (signingStore.template(); as template) {
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-semibold">{{ template.title }}</h3>
            <button mat-button type="button" (click)="toggleExpanded()">
              {{ expanded() ? Labels.Collapse : Labels.ReadFull }}
            </button>
          </div>
          @if (expanded()) {
            <div class="max-h-48 overflow-y-auto rounded border border-slate-200 p-3 text-sm">
              <p class="whitespace-pre-wrap">{{ template.content }}</p>
            </div>
          }
          <mat-checkbox [checked]="consented()" (change)="onConsentChanged($event.checked)">
            {{ Labels.ConsentPrefix }} {{ template.title }} {{ Labels.ConsentFrom }}
            {{ template.activatedAt | date: 'mediumDate' }}
          </mat-checkbox>
        </div>
      }

      <div class="rounded border border-slate-200 p-3 text-sm flex flex-col gap-1">
        <h3 class="font-semibold mb-1">{{ Labels.SigningSummaryTitle }}</h3>
        <div>{{ rentalStore.customer()?.firstName }} {{ rentalStore.customer()?.lastName }}</div>
        <div class="text-slate-500">{{ rentalStore.customer()?.phone }}</div>
        @for (item of equipmentItems(); track item.id) {
          <div class="flex justify-between">
            <span>{{ item.model }} ({{ item.uid }})</span>
            @if (item.estimatedCost; as cost) {
              <span>{{ cost | money }}</span>
            }
          </div>
        }
        <div class="flex justify-between mt-1">
          <span>{{ Labels.Duration }}</span>
          <span>{{ rentalStore.durationMinutes() | duration }}</span>
        </div>
        @if (rentalStore.estimatedCost(); as total) {
          <div class="flex justify-between font-semibold">
            <span>{{ Labels.Total }}</span>
            <span>{{ total | money }}</span>
          </div>
        }
        <p class="text-xs text-slate-500 mt-2">{{ Labels.SignatureStartNote }}</p>
      </div>

      <app-signature-pad (emptyChanged)="onPadEmptyChanged($event)" />
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button class="btn-caution" type="button" (click)="onCancel()">
        {{ Labels.Cancel }}
      </button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        [disabled]="padEmpty() || !consented() || signingStore.isSigning()"
        (click)="onSign()"
      >
        @if (signingStore.isSigning()) {
          <mat-spinner diameter="20" />
        } @else {
          {{ Labels.SignButton }}
        }
      </button>
    </mat-dialog-actions>
  `,
})
export class SigningDialogComponent {
  protected readonly Labels = Labels;
  protected readonly signingStore = inject(AgreementSigningStore);
  protected readonly rentalStore = inject(RentalStore);

  private readonly data = inject<SigningDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef =
    inject<MatDialogRef<SigningDialogComponent, SigningDialogResult>>(MatDialogRef);
  private readonly notifications = inject(NotificationService);

  private readonly pad = viewChild.required(SignaturePadComponent);

  protected readonly padEmpty = signal(true);
  protected readonly expanded = signal(false);
  protected readonly consented = signal(false);

  protected readonly equipmentItems = this.rentalStore.rentalEquipmentItems;

  protected onPadEmptyChanged(empty: boolean): void {
    this.padEmpty.set(empty);
  }

  protected toggleExpanded(): void {
    this.expanded.update((value) => !value);
  }

  protected onConsentChanged(checked: boolean): void {
    this.consented.set(checked);
  }

  protected onCancel(): void {
    this.dialogRef.close('cancelled');
  }

  protected onSign(): void {
    const png = this.pad().toDataUrl();
    if (!png) return;

    this.signingStore
      .sign(this.data.rentalId, png, this.data.version, this.rentalStore.operatorId())
      .subscribe({
        next: () => this.dialogRef.close('signed'),
        error: (err: unknown) => {
          const apiError = ApiErrorParser.parse(err);
          if (apiError.code === ErrorCode.AGREEMENT_SIGNING_INVALID_SIGNATURE_IMAGE) {
            this.notifications.error(resolveErrorMessage(apiError));
            this.pad().clear();
            return;
          }
          this.dialogRef.close({ error: apiError });
        },
      });
  }
}
