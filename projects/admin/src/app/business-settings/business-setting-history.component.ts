import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent, MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {
  BusinessSettingHistoryStore,
  BusinessSettingsStore,
  formatSettingValue,
  Labels,
  PointAdminStore,
  parseDate,
  SETTING_CHANGE_KIND_LABELS,
  settingLabel,
  TIME_ZONE_VALUE_TYPE,
  zoneWithOffset,
  toIsoDate,
} from '@bikerental/shared';
import type { BusinessSettingChange, SettingValue } from '@ui-models';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-business-setting-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [provideNativeDateAdapter()],
  imports: [
    DatePipe,
    MatTableModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatPaginatorModule,
    MatProgressBarModule,
  ],
  templateUrl: './business-setting-history.component.html',
})
export class BusinessSettingHistoryComponent implements OnInit {
  protected readonly Labels = Labels;

  protected readonly store = inject(BusinessSettingHistoryStore);
  protected readonly settings = inject(BusinessSettingsStore);
  private readonly points = inject(PointAdminStore);
  protected readonly displayedColumns = ['changedAt', 'setting', 'change', 'author'];

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.queryParams, { initialValue: {} as Params });

  protected readonly settingKey = computed<string>(() => this.params()['settingKey'] ?? '');
  protected readonly from = computed(() => parseDate(this.params()['from']) ?? null);
  protected readonly to = computed(() => parseDate(this.params()['to']) ?? null);
  protected readonly hasFilter = computed(() => !!(this.settingKey() || this.from() || this.to()));
  private readonly page = computed(() => toIndex(this.params()['page'], 0));
  private readonly size = computed(() => Math.min(toIndex(this.params()['size'], PAGE_SIZE), 100));

  constructor() {
    effect(() => {
      this.store.search({
        settingKey: this.settingKey() || undefined,
        from: this.from() ?? undefined,
        to: this.to() ?? undefined,
        pageIndex: this.page(),
        pageSize: this.size() || PAGE_SIZE,
      });
    });
  }

  ngOnInit(): void {
    this.settings.ensureLoaded();
    if (this.points.points().length === 0) this.points.load().subscribe();
  }

  protected levelOf(change: BusinessSettingChange): string {
    if (change.level !== 'POINT' || !change.pointSlug) return Labels.SettingHistoryBusinessLevel;
    const name = this.points.nameBySlug().get(change.pointSlug) ?? change.pointSlug;
    return Labels.settingHistoryPointLevel(name);
  }

  protected label(key: string, fallback: string): string {
    return settingLabel(key, fallback);
  }

  protected kindLabel(change: BusinessSettingChange): string {
    return SETTING_CHANGE_KIND_LABELS[change.changeKind];
  }

  protected format(change: BusinessSettingChange, value: SettingValue | null): string {
    if (change.valueType === TIME_ZONE_VALUE_TYPE) return zoneWithOffset(value);
    return formatSettingValue(value, change.kind, change.unit);
  }

  protected onSettingChange(key: string): void {
    this.updateUrl({ settingKey: key || null, page: null });
  }

  protected onFrom(event: MatDatepickerInputEvent<Date>): void {
    this.updateUrl({ from: event.value ? toIsoDate(event.value) : null, page: null });
  }

  protected onTo(event: MatDatepickerInputEvent<Date>): void {
    this.updateUrl({ to: event.value ? toIsoDate(event.value) : null, page: null });
  }

  protected clearFilters(): void {
    this.updateUrl({ settingKey: null, from: null, to: null, page: null });
  }

  protected onPageChange(event: PageEvent): void {
    this.updateUrl({
      page: event.pageIndex === 0 ? null : event.pageIndex,
      size: event.pageSize === PAGE_SIZE ? null : event.pageSize,
    });
  }

  private updateUrl(queryParams: Params): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
}

function toIndex(raw: unknown, fallback: number): number {
  const value = Number(raw);
  return raw !== undefined && Number.isInteger(value) && value >= 0 ? value : fallback;
}
