import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApiErrorParser,
  applyServerErrors,
  BusinessLocationStore,
  BusinessSettingMapper,
  BusinessSettingsStore,
  businessSettingValueValidator,
  CancelButtonComponent,
  clearServerErrors,
  ConfirmDialogComponent,
  datePatternSymbols,
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
  settingHint,
  settingLabel,
  settingUnitSuffix,
  TIME_ZONE_VALUE_TYPE,
  TimeZoneSelectComponent,
  zoneWithOffset,
} from '@bikerental/shared';
import type { ApiError, ConfirmDialogData } from '@bikerental/shared';
import type { BusinessSetting, SettingValue, SettingViolation } from '@ui-models';
import { DatePatternLegendComponent } from './date-pattern-legend.component';

export interface SettingDialogPoint {
  slug: string;
  name: string;
}

export interface BusinessSettingDialogData {
  setting: BusinessSetting;
  point?: SettingDialogPoint;
}

const RELOAD_CODES = new Set<string>([
  ErrorCode.SETTINGS_VERSION_CONFLICT,
  ErrorCode.SETTINGS_KEY_NOT_EDITABLE,
  ErrorCode.RESOURCE_NOT_FOUND,
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
    DatePatternLegendComponent,
    TimeZoneSelectComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ title }}</h2>
    <mat-dialog-content>
      <div class="flex flex-col gap-3 pt-1">
        <div>
          <div class="font-medium">{{ label }}</div>
          @if (hint) {
            <div class="text-sm text-slate-600">{{ hint }}</div>
          }
          <div class="font-mono text-xs text-slate-500">{{ setting.key }}</div>
        </div>

        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt class="text-slate-500">{{ Labels.BusinessSettingCurrentValue }}</dt>
          <dd class="font-mono">{{ format(currentValue) }}</dd>
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
          @if (isTimeZone) {
            <app-time-zone-select
              formControlName="value"
              [label]="Labels.BusinessSettingValueLabel"
              [countryCode]="businessLocation.zoneCountryCode()"
            />
          } @else {
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
          }
        </form>

        @if (patternSymbols.length) {
          <app-date-pattern-legend [symbols]="patternSymbols" />
        }
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
  private readonly data = inject<BusinessSettingDialogData>(MAT_DIALOG_DATA);
  protected readonly setting = this.data.setting;
  private readonly point = this.data.point;
  private readonly ownPointValue =
    this.setting.pointValues.find((p) => p.pointSlug === this.point?.slug) ?? null;
  protected readonly currentValue = this.ownPointValue?.value ?? this.setting.effectiveValue;
  protected readonly title = this.point
    ? Labels.settingPointDialogTitle(this.point.name)
    : Labels.BusinessSettingDialogTitle;
  protected readonly isTimeZone = this.setting.valueType === TIME_ZONE_VALUE_TYPE;
  protected readonly businessLocation = inject(BusinessLocationStore);
  private readonly dialog = inject(MatDialog);

  private readonly dialogRef =
    inject<MatDialogRef<BusinessSettingDialogComponent, boolean>>(MatDialogRef);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly numeric = this.setting.kind === 'minutes' || this.setting.kind === 'money';
  protected readonly unit = settingUnitSuffix(this.setting.kind, this.setting.unit);
  protected readonly ruleTexts = this.setting.rules.map(describeSettingRule).filter(Boolean);
  protected readonly label = settingLabel(this.setting.key, this.setting.description);
  protected readonly hint = settingHint(this.setting.key);
  protected readonly patternSymbols = datePatternSymbols(this.setting.valueType);

  protected readonly value = new FormControl(this.initialValue(), {
    nonNullable: true,
    validators: [businessSettingValueValidator(this.setting.kind, this.setting.rules)],
  });
  protected readonly form = new FormGroup({ value: this.value });

  protected format(value: SettingValue | null): string {
    if (this.isTimeZone) return zoneWithOffset(value);
    return formatSettingValue(value, this.setting.kind, this.setting.unit);
  }

  protected violationText(violations: SettingViolation[]): string {
    return violations.map(describeSettingViolation).join(' ');
  }

  save(): void {
    if (this.form.invalid || this.store.saving()) return;
    const parsed = parseSettingInput(String(this.value.value), this.setting.kind);
    if (parsed === null) return;
    if (!this.needsZoneConfirmation(parsed)) {
      this.submit(parsed);
      return;
    }
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: this.zoneConfirmation(parsed),
      })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.submit(parsed));
  }

  private needsZoneConfirmation(value: SettingValue): boolean {
    return !!this.point && this.isTimeZone && value !== this.setting.effectiveValue;
  }

  private zoneConfirmation(value: SettingValue): ConfirmDialogData {
    return {
      title: Labels.SettingPointZoneConfirmTitle,
      message: Labels.settingPointZoneConfirmMessage(
        this.point?.name ?? '',
        zoneWithOffset(value),
        zoneWithOffset(this.setting.effectiveValue),
      ),
      confirmLabel: Labels.SettingPointZoneConfirmButton,
      cancelLabel: Labels.Cancel,
    };
  }

  private submit(parsed: SettingValue): void {
    clearServerErrors(this.form);
    this.store
      .change(this.setting.key, {
        value: parsed,
        expectedVersion: this.point ? (this.ownPointValue?.version ?? 0) : this.setting.version,
        pointSlug: this.point?.slug,
      })
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
    const current = this.point
      ? this.currentValue
      : (this.setting.businessValue ?? this.setting.effectiveValue);
    if (current === null) return '';
    if (this.setting.kind === 'money' && typeof current === 'number') return current.toFixed(2);
    return String(current);
  }
}
