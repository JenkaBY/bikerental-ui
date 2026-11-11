import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  ViewContainerRef,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, switchMap } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ApiErrorParser,
  BusinessSettingsStore,
  ConfirmDialogComponent,
  formatSettingValue,
  Labels,
  NotificationService,
  PointAdminStore,
  resolveErrorMessage,
  settingBusyKey,
  settingLabel,
  TIME_ZONE_VALUE_TYPE,
  zoneWithOffset,
} from '@bikerental/shared';
import type { ConfirmDialogData } from '@bikerental/shared';
import type { BusinessSetting, Point, SettingValue } from '@ui-models';
import {
  BusinessSettingDialogComponent,
  BusinessSettingDialogData,
} from './business-setting-dialog.component';

interface PointSettingRow {
  slug: string;
  name: string;
  value: string;
  own: boolean;
  busy: boolean;
}

@Component({
  selector: 'app-business-setting-points',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  template: `
    <section class="mt-6">
      <h3 class="font-medium mb-2">{{ label() }} · {{ Labels.SettingPointValuesTitle }}</h3>
      @if (rows().length === 0) {
        <div class="text-sm text-slate-500">{{ Labels.SettingPointValuesEmpty }}</div>
      } @else {
        <div class="grid grid-cols-[1fr_1fr_auto_auto] gap-x-4 gap-y-1 items-center text-sm">
          <div class="text-slate-500">{{ Labels.SettingPointColumnPoint }}</div>
          <div class="text-slate-500">{{ Labels.SettingPointColumnValue }}</div>
          <div class="text-slate-500">{{ Labels.SettingPointColumnOrigin }}</div>
          <div></div>
          @for (row of rows(); track row.slug) {
            <div>{{ row.name }}</div>
            <div class="font-mono">{{ row.value }}</div>
            <span
              class="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
              [class]="row.own ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ row.own ? Labels.SettingPointOwnValue : Labels.SettingPointInheritedValue }}
            </span>
            <div class="flex gap-1">
              <button
                mat-icon-button
                [matTooltip]="Labels.BusinessSettingEditTooltip"
                (click)="edit(row)"
              >
                <mat-icon>edit</mat-icon>
              </button>
              <button
                mat-icon-button
                [disabled]="!row.own || row.busy"
                [matTooltip]="Labels.BusinessSettingResetTooltip"
                (click)="onReset(row)"
              >
                <mat-icon>restart_alt</mat-icon>
              </button>
            </div>
          }
        </div>
      }
    </section>
  `,
})
export class BusinessSettingPointsComponent {
  readonly setting = input.required<BusinessSetting>();

  protected readonly Labels = Labels;
  private readonly store = inject(BusinessSettingsStore);
  private readonly points = inject(PointAdminStore);
  private readonly dialog = inject(MatDialog);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly label = computed(() =>
    settingLabel(this.setting().key, this.setting().description),
  );

  protected readonly rows = computed<PointSettingRow[]>(() => {
    const setting = this.setting();
    const busy = this.store.busyKeys();
    return this.points
      .points()
      .filter((p: Point) => p.status !== 'PERMANENTLY_CLOSED')
      .map((p) => {
        const own = setting.pointValues.find((v) => v.pointSlug === p.slug);
        return {
          slug: p.slug,
          name: p.name,
          value: this.format(own?.value ?? setting.effectiveValue),
          own: !!own,
          busy: busy.has(settingBusyKey(setting.key, p.slug)),
        };
      });
  });

  protected edit(row: PointSettingRow): void {
    this.dialog.open<BusinessSettingDialogComponent, BusinessSettingDialogData, boolean>(
      BusinessSettingDialogComponent,
      {
        data: { setting: this.setting(), point: { slug: row.slug, name: row.name } },
        width: '560px',
        viewContainerRef: this.viewContainerRef,
      },
    );
  }

  protected onReset(row: PointSettingRow): void {
    const setting = this.setting();
    const data: ConfirmDialogData = {
      title: Labels.SettingPointResetDialogTitle,
      message: Labels.settingPointResetDialogMessage(row.name, this.format(setting.effectiveValue)),
      confirmLabel: Labels.BusinessSettingResetConfirmButton,
      cancelLabel: Labels.Cancel,
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data })
      .afterClosed()
      .pipe(
        filter((confirmed) => confirmed === true),
        switchMap(() => this.store.reset(setting, row.slug)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.notifications.success(Labels.SettingPointResetSuccess),
        error: (err) => {
          this.notifications.error(resolveErrorMessage(ApiErrorParser.parse(err)));
          this.store.load();
        },
      });
  }

  private format(value: SettingValue | null): string {
    const setting = this.setting();
    if (setting.valueType === TIME_ZONE_VALUE_TYPE) return zoneWithOffset(value);
    return formatSettingValue(value, setting.kind, setting.unit);
  }
}
