import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Location } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { catchError, exhaustMap, filter, tap } from 'rxjs/operators';
import {
  AgreementSigningStore,
  ApiErrorParser,
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  DurationPipe,
  ErrorCode,
  Labels,
  MoneyPipe,
  NotificationService,
  RentalStore,
  resolveErrorMessage,
  SignaturePadComponent,
} from '@bikerental/shared';
import { CancelRentalDialogComponent } from '../rental-detail/cancel-rental-dialog.component';

@Component({
  selector: 'app-rental-agreement',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalStore, AgreementSigningStore, BatchRentalPropertyStore, CustomerFinanceStore],
  imports: [
    MatButtonModule,
    MatCheckboxModule,
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
    <div class="flex flex-col gap-4">
      <div class="flex items-center gap-2">
        <button mat-icon-button type="button" (click)="onBack()" [attr.aria-label]="Labels.Back">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-lg font-semibold text-slate-800 m-0">{{ Labels.SigningDialogTitle }}</h1>
      </div>

      @if (isReady()) {
        <div class="rounded border border-slate-200 p-3 text-sm flex flex-col gap-1">
          @if (store.customer(); as customer) {
            <div>{{ customer.firstName }} {{ customer.lastName }} ({{ customer.phone }})</div>
          }
          @for (item of equipmentItems(); track item.id) {
            <div class="flex justify-between gap-2">
              <span class="min-w-0"
                >{{ item.model }} ({{ item.uid }}) &middot;
                {{ store.durationMinutes() | duration }}</span
              >
              @if (item.estimatedCost; as cost) {
                <span class="shrink-0 whitespace-nowrap">{{ cost | money }}</span>
              }
            </div>
          }

          <mat-divider class="!my-2" />

          @if (store.hasPricingBreakdown()) {
            @if (store.hasDiscount() && store.subtotal(); as sub) {
              <div class="flex justify-between">
                <span>{{ Labels.Subtotal }}</span>
                <span>{{ sub | money }}</span>
              </div>
            }
            @if (store.hasDiscount() && store.discountAmount(); as discAmt) {
              <div class="flex justify-between text-green-600">
                <span>{{ Labels.DiscountLabel }}&nbsp;&minus;{{ store.discountPercent() }}%</span>
                <span>&minus;{{ discAmt | money }}</span>
              </div>
            }
            @if (store.specialPriceEnabled()) {
              <div class="flex justify-between">
                <span>{{ Labels.SpecialPrice }}</span>
                <span>{{ store.estimatedCost() | money }}</span>
              </div>
            }

            <mat-divider class="!my-2" />
          }

          @if (store.estimatedCost(); as total) {
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
                >" {{ Labels.ConsentSuffix }}
                <button
                  type="button"
                  class="signing-consent-toggle"
                  (click)="toggleExpanded($event)"
                >
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

        <div class="flex gap-2">
          <button
            mat-stroked-button
            class="flex-1 !text-red-600 !border-red-400"
            type="button"
            (click)="onCancel()"
          >
            {{ Labels.Cancel }}
          </button>
          <button matButton="outlined" class="flex-1" type="button" (click)="onBack()">
            {{ Labels.Back }}
          </button>
          <button
            mat-flat-button
            color="primary"
            class="flex-1"
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
        </div>
      } @else {
        <div class="flex h-40 items-center justify-center">
          <p class="text-slate-500">{{ Labels.Loading }}</p>
        </div>
      }
    </div>
  `,
})
export class RentalAgreementComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(RentalStore);
  protected readonly signingStore = inject(AgreementSigningStore);

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  readonly id = input<string>();

  private readonly pad = viewChild.required(SignaturePadComponent);

  private readonly navVersion: number | null;
  private loadInitiated = false;

  protected readonly padEmpty = signal(true);
  protected readonly expanded = signal(false);
  protected readonly consented = signal(false);
  protected readonly signed = signal(false);

  protected readonly equipmentItems = this.store.rentalEquipmentItems;

  private readonly numericId = computed(() => {
    const raw = this.id();
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
  });

  protected readonly isReady = computed(
    () => this.store.id() !== null && this.signingStore.template() !== null,
  );

  private readonly signingVersion = computed(() => this.navVersion ?? this.store.version() ?? 0);

  constructor() {
    this.navVersion =
      (this.router.getCurrentNavigation()?.extras.state?.['version'] as number | undefined) ?? null;

    effect(() => {
      const id = this.numericId();
      if (id === null || this.loadInitiated) return;
      this.loadInitiated = true;
      this.store.loadDetail(id);
      this.signingStore
        .loadRentalAgreement(id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({ error: () => undefined });
    });
  }

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

  protected onBack(): void {
    if (this.signed() || this.store.id() === null || !this.store.isAwaitingSignature()) {
      this.location.back();
      return;
    }
    this.store
      .cancelSigning()
      .pipe(
        catchError(() => of(undefined)),
        tap(() => this.location.back()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onCancel(): void {
    this.dialog
      .open(CancelRentalDialogComponent, { disableClose: false })
      .afterClosed()
      .pipe(
        filter((confirmed): confirmed is true => !!confirmed),
        exhaustMap(() =>
          this.store.cancelRental().pipe(
            tap(() => this.notifications.success(Labels.RentalCancelSuccess)),
            catchError((err: unknown) => {
              const apiError = ApiErrorParser.parse(err);
              this.notifications.error(resolveErrorMessage(apiError));
              return EMPTY;
            }),
          ),
        ),
        tap(() => void this.router.navigate(['/rentals'])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  protected onSign(): void {
    const png = this.pad().toDataUrl();
    const id = this.store.id();
    if (!png || id === null) return;

    this.signingStore
      .sign(id, png, this.signingVersion(), this.store.operatorId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.signed.set(true);
          this.notifications.success(Labels.AgreementSignedSuccess);
          void this.router.navigate(['/rentals', id], { replaceUrl: true });
        },
        error: (err: unknown) => {
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(resolveErrorMessage(apiError));
          if (apiError.code === ErrorCode.AGREEMENT_SIGNING_INVALID_SIGNATURE_IMAGE) {
            this.pad().clear();
            return;
          }
          this.store.loadDetail(id);
        },
      });
  }
}
