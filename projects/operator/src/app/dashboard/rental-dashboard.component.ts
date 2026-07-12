import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import {
  Labels,
  PageHeaderComponent,
  RentalListStore,
  SegmentedTabsComponent,
  SegmentTab,
} from '@bikerental/shared';
import { RentalActiveTabComponent } from './rental-active-tab.component';
import { RentalHistoryTabComponent } from './rental-history-tab.component';
import { REFRESHABLE_TAB } from './refreshable-tab';

@Component({
  selector: 'app-rental-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalListStore],
  imports: [
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    SegmentedTabsComponent,
    RentalActiveTabComponent,
    RentalHistoryTabComponent,
  ],
  template: `
    <div class="-m-4">
      <app-page-header [title]="Labels.Rentals" [showBack]="false">
        <button
          actions
          mat-icon-button
          [disabled]="isLoading()"
          (click)="onRefresh()"
          [attr.aria-label]="Labels.Refresh"
        >
          @if (isLoading()) {
            <mat-progress-spinner diameter="20" mode="indeterminate" />
          } @else {
            <mat-icon>refresh</mat-icon>
          }
        </button>
      </app-page-header>
      <app-segmented-tabs
        [tabs]="tabs"
        [activeId]="activeTab()"
        (tabSelect)="onTabChange($event)"
      />
      @if (activeTab() === 'active') {
        <app-rental-active-tab />
      } @else {
        <app-rental-history-tab />
      }
    </div>
  `,
})
export class RentalDashboardComponent {
  private readonly router = inject(Router);

  readonly tab = input<string>();

  private readonly activeTabRef = viewChild(REFRESHABLE_TAB);

  readonly activeTab = computed(() => (this.tab() === 'history' ? 'history' : 'active'));

  readonly isLoading = computed(() => this.activeTabRef()?.isLoading() ?? false);

  protected readonly Labels = Labels;

  protected readonly tabs: SegmentTab[] = [
    { id: 'active', label: Labels.RentalStatusActive },
    { id: 'history', label: Labels.TodaysHistory },
  ];

  protected onTabChange(tab: string): void {
    void this.router.navigate([], {
      queryParams: { tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected onRefresh(): void {
    this.activeTabRef()?.refresh();
  }
}
