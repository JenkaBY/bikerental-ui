import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApiErrorParser,
  applyServerErrors,
  BusinessSettingMapper,
  BusinessSettingsStore,
  businessSettingValueValidator,
  CancelButtonComponent,
  clearServerErrors,
  describeSettingRule,
  describeSettingViolation,
  ErrorCode,
  formatSettingValue,
  FormErrorMessages,
  Labels,
  NotificationService,
  parseSettingInput,
  resolveErrorMessage,
  SERVER_ERROR_KEY,
  SETTING_VIOLATIONS_KEY,
  settingUnitSuffix,
} from '@bikerental/shared';
import type { ApiError } from '@bikerental/shared';
import type { BusinessSetting, SettingValue, SettingViolation } from '@ui-models';

export interface BusinessSettingDialogData {
  setting: BusinessSetting;
}

const RELOAD_CODES = new Set<string>([
  ErrorCode.SETTINGS_VERSION_CONFLICT,
  ErrorCode.SETTINGS_KEY_NOT_EDITABLE,
]);

@Component({
  selector: 'app-business-setting-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CancelButtonComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.BusinessSettingDialogTitle }}</h2>
    <mat-dialog-content>
      <div class="flex flex-col gap-3 pt-1">
        <div>
          <div class="font-medium">{{ setting.description }}</div>
          <div class="font-mono text-xs text-slate-500">{{ setting.key }}</div>
        </div>

        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt class="text-slate-500">{{ Labels.BusinessSettingCurrentValue }}</dt>
          <dd class="font-mono">{{ format(setting.effectiveValue) }}</dd>
          <dt class="text-slate-500">{{ Labels.BusinessSettingDefaultValue }}</dt>
          <dd class="font-mono">{{ format(setting.installationDefault) }}</dd>
        </dl>

        <div class="text-sm">
          <div class="text-slate-500 mb-1">{{ Labels.BusinessSettingRulesTitle }}</div>
          @if (ruleTexts.length) {
            <ul class="list-disc pl-5">
              @for (rule of ruleTexts; track $index) {
                <li>{{ rule }}</li>
              }
            </ul>
          } @else {
            <div class="text-slate-400">{{ Labels.BusinessSettingNoRules }}</div>
          }
        </div>

        <form [formGroup]="form" (ngSubmit)="save()">
          <mat-form-field appearance="outline" class="w-full">
            <mat-label>{{ Labels.BusinessSettingValueLabel }}</mat-label>
            <input
              matInput
              formControlName="value"
              [type]="numeric ? 'number' : 'text'"
              [step]="setting.kind === 'money' ? '0.01' : '1'"
              [class.font-mono]="setting.kind === 'text'"
              autocomplete="off"
            />
            @if (unit) {
              <span matTextSuffix>{{ unit }}</span>
            }
            @if (value.hasError('required')) {
              <mat-error>{{ FormErrorMessages.required }}</mat-error>
            } @else if (value.hasError(SERVER_ERROR_KEY)) {
              <mat-error>{{ value.getError(SERVER_ERROR_KEY) }}</mat-error>
            } @else if (value.hasError(SETTING_VIOLATIONS_KEY)) {
              <mat-error>{{ violationText(value.getError(SETTING_VIOLATIONS_KEY)) }}</mat-error>
            }
          </mat-form-field>
        </form>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <app-form-cancel-button />
      <button
        mat-flat-button
        color="primary"
        [disabled]="form.invalid || store.saving()"
        (click)="save()"
      >
        {{ Labels.Save }}
      </button>
    </mat-dialog-actions>
  `,
})
export class BusinessSettingDialogComponent {
  protected readonly Labels = Labels;
  protected readonly FormErrorMessages = FormErrorMessages;
  protected readonly SERVER_ERROR_KEY = SERVER_ERROR_KEY;
  protected readonly SETTING_VIOLATIONS_KEY = SETTING_VIOLATIONS_KEY;
  protected readonly store = inject(BusinessSettingsStore);
  protected readonly setting = inject<BusinessSettingDialogData>(MAT_DIALOG_DATA).setting;

  private readonly dialogRef =
    inject<MatDialogRef<BusinessSettingDialogComponent, boolean>>(MatDialogRef);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly numeric = this.setting.kind === 'minutes' || this.setting.kind === 'money';
  protected readonly unit = settingUnitSuffix(this.setting.kind, this.setting.unit);
  protected readonly ruleTexts = this.setting.rules.map(describeSettingRule).filter(Boolean);

  protected readonly value = new FormControl(this.initialValue(), {
    nonNullable: true,
    validators: [businessSettingValueValidator(this.setting.kind, this.setting.rules)],
  });
  protected readonly form = new FormGroup({ value: this.value });

  protected format(value: SettingValue | null): string {
    return formatSettingValue(value, this.setting.kind, this.setting.unit);
  }

  protected violationText(violations: SettingViolation[]): string {
    return violations.map(describeSettingViolation).join(' ');
  }

  save(): void {
    if (this.form.invalid || this.store.saving()) return;
    const parsed = parseSettingInput(String(this.value.value), this.setting.kind);
    if (parsed === null) return;

    clearServerErrors(this.form);
    this.store
      .change(this.setting.key, { value: parsed, expectedVersion: this.setting.version })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.success(Labels.BusinessSettingSaveSuccess);
          this.dialogRef.close(true);
        },
        error: (err) => this.handleError(ApiErrorParser.parse(err)),
      });
  }

  private handleError(apiError: ApiError): void {
    if (RELOAD_CODES.has(apiError.code)) {
      this.notifications.warn(resolveErrorMessage(apiError));
      this.store.load();
      this.dialogRef.close(false);
      return;
    }

    const violations = BusinessSettingMapper.violationsFromParams(apiError.params);
    if (apiError.code === ErrorCode.SETTINGS_VALUE_INVALID && violations.length) {
      this.setServerError(this.violationText(violations));
      return;
    }

    const valueErrors = apiError.fieldErrors.filter((f) => f.field === 'value');
    const unmatched = applyServerErrors(this.form, { ...apiError, fieldErrors: valueErrors });
    if (valueErrors.length && !unmatched.length) return;
    this.notifications.error(resolveErrorMessage(apiError));
  }

  private setServerError(message: string): void {
    this.value.setErrors({ ...(this.value.errors ?? {}), [SERVER_ERROR_KEY]: message });
    this.value.markAsTouched();
  }

  private initialValue(): string {
    const current = this.setting.businessValue ?? this.setting.effectiveValue;
    if (current === null) return '';
    if (this.setting.kind === 'money' && typeof current === 'number') return current.toFixed(2);
    return String(current);
  }
}
