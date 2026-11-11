import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  computed,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ApiErrorParser,
  BusinessSettingsStore,
  ConfirmDialogComponent,
  ErrorCode,
  formatSettingValue,
  Labels,
  NotificationService,
  PointAdminStore,
  resolveErrorMessage,
  SETTING_SOURCE_META,
  settingHint,
  settingLabel,
  TIME_ZONE_VALUE_TYPE,
  zoneWithOffset,
} from '@bikerental/shared';
import type { ConfirmDialogData, SettingSourceMeta } from '@bikerental/shared';
import type { BusinessSetting, SettingValue } from '@ui-models';
import {
  BusinessSettingDialogComponent,
  BusinessSettingDialogData,
} from './business-setting-dialog.component';
import { BusinessSettingPointsComponent } from './business-setting-points.component';

const RELOAD_CODES = new Set<string>([
  ErrorCode.SETTINGS_VERSION_CONFLICT,
  ErrorCode.SETTINGS_KEY_NOT_EDITABLE,
]);

@Component({
  selector: 'app-business-setting-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
    BusinessSettingPointsComponent,
  ],
  template: `
    @if (store.loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @if (store.error()) {
      <div class="text-center mt-6 flex flex-col items-center gap-2">
        <p class="text-slate-500">{{ Labels.BusinessSettingsLoadError }}</p>
        <button mat-stroked-button (click)="store.load()">{{ Labels.Retry }}</button>
      </div>
    } @else if (store.loaded() && store.settings().length === 0) {
      <div class="text-sm text-slate-500 py-6">{{ Labels.BusinessSettingsEmptyState }}</div>
    } @else if (store.settings().length > 0) {
      <table mat-table [dataSource]="store.settings()" class="w-full">
        <ng-container matColumnDef="setting">
          <th mat-header-cell *matHeaderCellDef>{{ Labels.BusinessSettingColumnSetting }}</th>
          <td mat-cell *matCellDef="let row" class="!py-2">
            <div class="font-medium">{{ labelOf(row) }}</div>
            @if (hintOf(row); as hint) {
              <div class="text-xs text-slate-600 max-w-xl">{{ hint }}</div>
            }
            <div class="font-mono text-xs text-slate-500">{{ row.key }}</div>
          </td>
        </ng-container>

        <ng-container matColumnDef="value">
          <th mat-header-cell *matHeaderCellDef>{{ Labels.BusinessSettingColumnValue }}</th>
          <td mat-cell *matCellDef="let row" class="font-mono whitespace-nowrap">
            {{ format(row, row.effectiveValue) }}
          </td>
        </ng-container>

        <ng-container matColumnDef="source">
          <th mat-header-cell *matHeaderCellDef>{{ Labels.BusinessSettingColumnSource }}</th>
          <td mat-cell *matCellDef="let row">
            <span
              class="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
              [class]="sourceOf(row).badgeClass"
            >
              {{ sourceOf(row).label }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="default">
          <th mat-header-cell *matHeaderCellDef>{{ Labels.BusinessSettingColumnDefault }}</th>
          <td mat-cell *matCellDef="let row" class="font-mono text-slate-500 whitespace-nowrap">
            {{ format(row, row.installationDefault) }}
          </td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>{{ Labels.BusinessSettingColumnActions }}</th>
          <td mat-cell *matCellDef="let row">
            <div class="flex gap-1 items-center">
              <button
                mat-icon-button
                [disabled]="row.kind === 'unknown'"
                [matTooltip]="Labels.BusinessSettingEditTooltip"
                (click)="openEditDialog(row)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                [disabled]="row.businessValue === null || store.busyKeys().has(row.key)"
                [matTooltip]="Labels.BusinessSettingResetTooltip"
                (click)="onReset(row)"
              >
                <mat-icon>restart_alt</mat-icon>
              </button>
              <button
                mat-icon-button
                [matTooltip]="Labels.BusinessSettingHistoryTooltip"
                (click)="openHistory(row)"
              >
                <mat-icon>history</mat-icon>
              </button>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let _row; columns: displayedColumns"></tr>
      </table>
      @for (setting of pointSettings(); track setting.key) {
        <app-business-setting-points [setting]="setting" />
      }
    }
  `,
})
export class BusinessSettingListComponent implements OnInit {
  protected readonly Labels = Labels;
  protected readonly store = inject(BusinessSettingsStore);

  protected readonly displayedColumns = ['setting', 'value', 'source', 'default', 'actions'];

  private readonly points = inject(PointAdminStore);
  protected readonly pointSettings = computed(() =>
    this.store.settings().filter((s) => s.permittedLevels.includes('POINT')),
  );

  private readonly dialog = inject(MatDialog);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  ngOnInit(): void {
    this.store.load();
    this.points.load().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  protected sourceOf(setting: BusinessSetting): SettingSourceMeta {
    return SETTING_SOURCE_META[setting.effectiveSource];
  }

  protected labelOf(setting: BusinessSetting): string {
    return settingLabel(setting.key, setting.description);
  }

  protected hintOf(setting: BusinessSetting): string {
    return settingHint(setting.key);
  }

  protected format(setting: BusinessSetting, value: SettingValue | null): string {
    if (setting.valueType === TIME_ZONE_VALUE_TYPE) return zoneWithOffset(value);
    return formatSettingValue(value, setting.kind, setting.unit);
  }

  openEditDialog(setting: BusinessSetting): void {
    this.dialog.open<BusinessSettingDialogComponent, BusinessSettingDialogData, boolean>(
      BusinessSettingDialogComponent,
      { data: { setting }, width: '560px', viewContainerRef: this.viewContainerRef },
    );
  }

  openHistory(setting: BusinessSetting): void {
    void this.router.navigate(['/business-settings/history'], {
      queryParams: { settingKey: setting.key },
    });
  }

  onReset(setting: BusinessSetting): void {
    const data: ConfirmDialogData = {
      title: Labels.BusinessSettingResetDialogTitle,
      message: Labels.businessSettingResetDialogMessage(
        this.labelOf(setting),
        this.format(setting, setting.installationDefault),
      ),
      confirmLabel: Labels.BusinessSettingResetConfirmButton,
      cancelLabel: Labels.Cancel,
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.reset(setting);
      });
  }

  private reset(setting: BusinessSetting): void {
    this.store
      .reset(setting)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.notifications.success(Labels.BusinessSettingResetSuccess),
        error: (err) => {
          const apiError = ApiErrorParser.parse(err);
          if (RELOAD_CODES.has(apiError.code)) {
            this.notifications.warn(resolveErrorMessage(apiError));
            this.store.load();
          } else {
            this.notifications.error(resolveErrorMessage(apiError));
          }
        },
      });
  }
}
