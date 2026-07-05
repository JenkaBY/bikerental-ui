import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { Money } from '@bikerental/shared';
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
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DurationPipe,
    MoneyPipe,
    SignaturePadComponent,
  ],
  styles: `
    .signing-consent-toggle {
      all: unset;
      cursor: pointer;
      color: #2563eb;
      text-decoration: underline;
      font-weight: 600;
    }
  `,
  template: `
    <h2 mat-dialog-title>{{ Labels.SigningDialogTitle }}</h2>
    <mat-dialog-content class="flex flex-col gap-4">
      <div class="rounded border border-slate-200 p-3 text-sm flex flex-col gap-1">
        <div>
          {{ rentalStore.customer()?.firstName }} {{ rentalStore.customer()?.lastName }} ({{
            rentalStore.customer()?.phone
          }})
        </div>
        @for (item of equipmentItems(); track item.id) {
          <div class="flex justify-between gap-2">
            <span class="min-w-0">
              {{ item.model }} ({{ item.uid }}) &middot;
              {{ rentalStore.durationMinutes() | duration }}
            </span>
            @if (item.estimatedCost; as cost) {
              <span class="shrink-0 whitespace-nowrap">{{ cost | money }}</span>
            }
          </div>
        }

        <mat-divider class="!my-2" />

        @if (hasDiscount() && subtotal(); as sub) {
          <div class="flex justify-between">
            <span>{{ Labels.Subtotal }}</span>
            <span>{{ sub | money }}</span>
          </div>
        }
        @if (hasDiscount() && discountAmount(); as discAmt) {
          <div class="flex justify-between text-green-600">
            <span>{{ Labels.DiscountLabel }}&nbsp;&minus;{{ rentalStore.discountPercent() }}%</span>
            <span>&minus;{{ discAmt | money }}</span>
          </div>
        }
        @if (rentalStore.specialPriceEnabled()) {
          <div class="flex justify-between">
            <span>{{ Labels.SpecialPrice }}</span>
            <span>{{ rentalStore.estimatedCost() | money }}</span>
          </div>
        }

        <mat-divider class="!my-2" />

        @if (rentalStore.estimatedCost(); as total) {
          <div class="flex justify-between font-semibold">
            <span>{{ Labels.Total }}</span>
            <span>{{ total | money }}</span>
          </div>
        }
        <p class="text-xs text-slate-500 mt-2">{{ Labels.SignatureStartNote }}</p>
      </div>

      @if (signingStore.template(); as template) {
        <div class="flex flex-col gap-1">
          <mat-checkbox [checked]="consented()" (change)="onConsentChanged($event.checked)">
            <span>
              {{ Labels.ConsentPrefix }} "<span class="underline">{{ template.title }}</span
              >"
              {{ Labels.ConsentSuffix }}
              <button type="button" class="signing-consent-toggle" (click)="toggleExpanded($event)">
                {{ expanded() ? Labels.HideAgreement : Labels.ViewAgreement }}
              </button>
            </span>
          </mat-checkbox>
          <p class="text-xs text-slate-500 pl-8">{{ Labels.ConsentSignBelowNote }}</p>
          @if (expanded()) {
            <div class="max-h-48 overflow-y-auto rounded border border-slate-200 p-3 text-sm">
              <p class="whitespace-pre-wrap">{{ template.content }}</p>
            </div>
          }
        </div>
      }

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

  protected readonly subtotal = computed<Money | null>(() => {
    const items = this.equipmentItems();
    if (items.length === 0) return null;
    const amount = items.reduce((sum, item) => sum + (item.estimatedCost?.amount ?? 0), 0);
    const currency =
      items.find((item) => item.estimatedCost)?.estimatedCost?.currency ??
      this.rentalStore.estimatedCost()?.currency ??
      'BYN';
    return { amount, currency };
  });

  protected readonly hasDiscount = computed(() => {
    const percent = this.rentalStore.discountPercent();
    return !this.rentalStore.specialPriceEnabled() && percent != null && percent > 0;
  });

  protected readonly discountAmount = computed<Money | null>(() => {
    if (!this.hasDiscount()) return null;
    const sub = this.subtotal();
    const total = this.rentalStore.estimatedCost();
    if (!sub || !total) return null;
    return { amount: sub.amount - total.amount, currency: sub.currency };
  });

  protected onPadEmptyChanged(empty: boolean): void {
    this.padEmpty.set(empty);
  }

  protected toggleExpanded(event: Event): void {
    event.stopPropagation();
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
