import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  ApiErrorParser,
  applyGeoLocationErrors,
  BusinessSettingMapper,
  BusinessSettingsStore,
  CancelButtonComponent,
  createGeoLocationGroup,
  describeSettingViolation,
  ErrorCode,
  GeoLocationFieldsComponent,
  geoLocationFormValue,
  GeoLocationLookupStore,
  GeoLocationSaveError,
  isSameGeoLocation,
  Labels,
  NotificationService,
  resolveErrorMessage,
  settingHint,
  settingLabel,
  syncGeoLocationEnabled,
  toGeoLocationId,
  toGeoLocationWrite,
} from '@bikerental/shared';
import type { BusinessSetting } from '@ui-models';

export interface BusinessGeoLocationDialogData {
  setting: BusinessSetting;
}

const RELOAD_CODES = new Set<string>([
  ErrorCode.SETTINGS_VERSION_CONFLICT,
  ErrorCode.SETTINGS_KEY_NOT_EDITABLE,
]);

@Component({
  selector: 'app-business-geo-location-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    CancelButtonComponent,
    GeoLocationFieldsComponent,
  ],
  template: `
    <h2 mat-dialog-title>{{ Labels.BusinessSettingDialogTitle }}</h2>
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
          <dd>{{ lookup.describe(setting.effectiveValue) }}</dd>
          <dt class="text-slate-500">{{ Labels.BusinessSettingDefaultValue }}</dt>
          <dd>{{ lookup.describe(setting.installationDefault) }}</dd>
        </dl>

        <form [formGroup]="form" class="min-w-[640px]" (ngSubmit)="save()">
          <app-geo-location-fields [group]="form" />
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
export class BusinessGeoLocationDialogComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(BusinessSettingsStore);
  protected readonly lookup = inject(GeoLocationLookupStore);
  protected readonly setting = inject<BusinessGeoLocationDialogData>(MAT_DIALOG_DATA).setting;
  protected readonly label = settingLabel(this.setting.key, this.setting.description);
  protected readonly hint = settingHint(this.setting.key);

  private readonly dialogRef =
    inject<MatDialogRef<BusinessGeoLocationDialogComponent, boolean>>(MatDialogRef);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly currentId = toGeoLocationId(this.setting.businessValue);
  private readonly current = this.currentId
    ? (this.lookup.byId().get(this.currentId) ?? null)
    : null;

  protected readonly form = createGeoLocationGroup();

  constructor() {
    this.form.reset(geoLocationFormValue(this.current));
    syncGeoLocationEnabled(this.form);
  }

  protected save(): void {
    if (this.form.invalid || this.store.saving()) return;
    const write = toGeoLocationWrite(this.form);
    if (!write) return;
    if (isSameGeoLocation(write, this.current)) {
      this.dialogRef.close(false);
      return;
    }
    this.store
      .changeGeoLocation(this.setting, write)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.notifications.success(Labels.BusinessSettingSaveSuccess);
          this.dialogRef.close(true);
        },
        error: (err) => this.handleError(err),
      });
  }

  private handleError(err: unknown): void {
    if (err instanceof GeoLocationSaveError) {
      const summary = applyGeoLocationErrors(this.form, err.cause);
      if (summary.length) this.notifications.error(summary.join(' '));
      return;
    }
    const apiError = ApiErrorParser.parse(err);
    if (RELOAD_CODES.has(apiError.code)) {
      this.notifications.warn(resolveErrorMessage(apiError));
      this.store.load();
      this.dialogRef.close(false);
      return;
    }
    const violations = BusinessSettingMapper.violationsFromParams(apiError.params);
    this.notifications.error(
      violations.length
        ? violations.map(describeSettingViolation).join(' ')
        : resolveErrorMessage(apiError),
    );
  }
}
