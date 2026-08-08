import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MAT_BOTTOM_SHEET_DATA, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { v4 as uuid } from 'uuid';
import type { DamageCondition, DamageReport, RentalEquipmentItem } from '@ui-models';
import {
  ApiErrorParser,
  applyServerErrors,
  clearServerErrors,
  DamageReportCreateStore,
  ErrorMessageResolver,
  FormErrorMessages,
  Labels,
  MaxDecimalsDirective,
  maxDecimalPlacesValidator,
  NotificationService,
  suppressErrorNotification,
} from '@bikerental/shared';

const MAX_ITEMS = 5;

interface ReportDamageSheetData {
  rentalId: number;
  equipmentItems: RentalEquipmentItem[];
}

export type ReportDamageResult = { outcome: 'created'; report: DamageReport } | undefined;

@Component({
  selector: 'app-report-damage-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DamageReportCreateStore],
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MaxDecimalsDirective,
  ],
  template: `
    <div class="px-4 pt-4 pb-2">
      <h2 class="text-base font-bold text-slate-900">{{ Labels.ReportDamageTitle }}</h2>
      <p class="text-sm text-slate-500 mt-0.5">{{ Labels.ReportDamageSubtitle }}</p>
    </div>

    <mat-divider />

    <div class="overflow-y-auto max-h-[60vh] px-4 py-2">
      <div class="flex flex-col gap-1 py-2">
        @for (item of data.equipmentItems; track item.id) {
          <div class="flex items-center gap-3 py-1.5">
            <mat-checkbox
              [checked]="isChecked(item.id)"
              [disabled]="isLimitReached() && !isChecked(item.id)"
              (change)="onToggleItem(item.id, $event.checked)"
            />
            <span class="flex-1 min-w-0">
              <span class="block text-sm font-semibold text-slate-900 truncate">{{
                item.model
              }}</span>
              <span class="block text-xs text-slate-500 truncate">
                {{ item.type.name }} · {{ item.uid }}
                @if (item.isReturned) {
                  · {{ Labels.Returned }}
                }
              </span>
            </span>
          </div>
        }
      </div>
      @if (isLimitReached()) {
        <p class="text-xs text-amber-600 pb-2">{{ Labels.ReportDamageEquipmentLimitHint }}</p>
      }

      <mat-divider />

      <form [formGroup]="form" class="flex flex-col gap-3 pt-3">
        <div>
          <p class="text-xs font-medium text-slate-500 mb-1">
            {{ Labels.ReportDamageConditionLabel }}
          </p>
          <mat-button-toggle-group formControlName="condition" class="w-full">
            <mat-button-toggle value="BROKEN" class="flex-1">{{
              Labels.ReportDamageConditionBroken
            }}</mat-button-toggle>
            <mat-button-toggle value="MAINTENANCE" class="flex-1">{{
              Labels.ReportDamageConditionMaintenance
            }}</mat-button-toggle>
          </mat-button-toggle-group>
        </div>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>{{ Labels.ReportDamageDescriptionLabel }}</mat-label>
          <textarea
            matInput
            rows="3"
            formControlName="description"
            [placeholder]="Labels.ReportDamageDescriptionPlaceholder"
            maxlength="2000"
          ></textarea>
          @if (
            form.controls.description.hasError('required') && form.controls.description.touched
          ) {
            <mat-error>{{ FormErrorMessages.required }}</mat-error>
          }
          @if (form.controls.description.hasError('server')) {
            <mat-error>{{ form.controls.description.getError('server') }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>{{ Labels.ReportDamagePenaltyLabel }}</mat-label>
          <input
            matInput
            type="number"
            min="0.01"
            step="0.01"
            formControlName="penaltyAmount"
            [appMaxDecimals]="2"
          />
          <span matTextSuffix>{{ Labels.CurrencySymbol }}</span>
          @if (form.controls.penaltyAmount.hasError('server')) {
            <mat-error>{{ form.controls.penaltyAmount.getError('server') }}</mat-error>
          }
        </mat-form-field>
      </form>
    </div>

    <mat-divider />

    <div class="flex gap-3 px-4 py-3">
      <button mat-stroked-button class="flex-1" [disabled]="saving()" (click)="onCancel()">
        {{ Labels.Cancel }}
      </button>
      <button
        mat-flat-button
        color="primary"
        class="flex-1"
        [disabled]="form.invalid || selectedIds().size === 0 || saving()"
        (click)="onSubmit()"
      >
        {{ Labels.ReportDamageSubmit }}
      </button>
    </div>
  `,
})
export class ReportDamageSheetComponent {
  protected readonly data = inject<ReportDamageSheetData>(MAT_BOTTOM_SHEET_DATA);
  private readonly sheetRef = inject(
    MatBottomSheetRef<ReportDamageSheetComponent, ReportDamageResult>,
  );
  private readonly store = inject(DamageReportCreateStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);

  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;
  protected readonly saving = this.store.saving;

  protected readonly selectedIds = signal<Set<number>>(new Set());
  protected readonly isLimitReached = () => this.selectedIds().size >= MAX_ITEMS;
  protected readonly isChecked = (id: number) => this.selectedIds().has(id);

  private readonly idempotencyKey = uuid();

  protected readonly form = new FormGroup({
    condition: new FormControl<DamageCondition>('BROKEN', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(2000)],
    }),
    penaltyAmount: new FormControl<number | null>(null, [
      Validators.min(0.01),
      maxDecimalPlacesValidator(2),
    ]),
  });

  protected onToggleItem(id: number, checked: boolean): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (checked) {
        if (next.size >= MAX_ITEMS) return next;
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.selectedIds().size === 0 || this.saving()) return;
    clearServerErrors(this.form);
    const { condition, description, penaltyAmount } = this.form.getRawValue();

    this.store
      .register(
        {
          equipmentIds: [...this.selectedIds()],
          rentalId: this.data.rentalId,
          condition,
          description,
          penaltyAmount: penaltyAmount ?? undefined,
          idempotencyKey: this.idempotencyKey,
        },
        { context: suppressErrorNotification() },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (report) => this.sheetRef.dismiss({ outcome: 'created', report }),
        error: (err: unknown) => this.handleError(err),
      });
  }

  private handleError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    const unmatched = applyServerErrors(this.form, apiError);
    if (apiError.fieldErrors.length === 0) {
      this.notifications.error(this.resolver.resolve(apiError));
    } else if (unmatched.length) {
      this.notifications.error(unmatched.join(' '));
    }
  }

  protected onCancel(): void {
    this.sheetRef.dismiss();
  }
}
