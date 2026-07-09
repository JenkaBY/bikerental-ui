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
import { MatTabsModule } from '@angular/material/tabs';
import { Labels, RentalListStore } from '@bikerental/shared';
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
    MatTabsModule,
    RentalActiveTabComponent,
    RentalHistoryTabComponent,
  ],
  template: `
    <div class="-mx-4 -mt-4">
      <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <h1 class="text-xl font-semibold text-slate-800">{{ Labels.Rentals }}</h1>
        <button
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
      </div>
      <nav mat-tab-nav-bar [tabPanel]="tabPanel">
        <a
          mat-tab-link
          tabindex="0"
          [active]="activeTab() === 'active'"
          (click)="onTabChange('active')"
          (keydown.enter)="onTabChange('active')"
          (keydown.space)="$event.preventDefault(); onTabChange('active')"
        >
          {{ Labels.RentalStatusActive }}
        </a>
        <a
          mat-tab-link
          tabindex="0"
          [active]="activeTab() === 'history'"
          (click)="onTabChange('history')"
          (keydown.enter)="onTabChange('history')"
          (keydown.space)="$event.preventDefault(); onTabChange('history')"
        >
          {{ Labels.TodaysHistory }}
        </a>
      </nav>
    </div>
    <mat-tab-nav-panel #tabPanel>
      @if (activeTab() === 'active') {
        <app-rental-active-tab />
      } @else {
        <app-rental-history-tab />
      }
    </mat-tab-nav-panel>
  `,
})
export class RentalDashboardComponent {
  private readonly router = inject(Router);

  readonly tab = input<string>();

  private readonly activeTabRef = viewChild(REFRESHABLE_TAB);

  readonly activeTab = computed(() => (this.tab() === 'history' ? 'history' : 'active'));

  readonly isLoading = computed(() => this.activeTabRef()?.isLoading() ?? false);

  protected readonly Labels = Labels;

  protected onTabChange(tab: 'active' | 'history'): void {
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
