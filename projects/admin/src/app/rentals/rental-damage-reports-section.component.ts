import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import {
  CollapsibleSectionComponent,
  DamageReportListItemComponent,
  DamageReportStore,
  Labels,
  RentalStore,
} from '@bikerental/shared';

const REPORTS_PAGE_SIZE = 50;

@Component({
  selector: 'app-rental-damage-reports-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterLink,
    CollapsibleSectionComponent,
    DamageReportListItemComponent,
  ],
  template: `
    <app-collapsible-section
      [title]="Labels.RentalDamageReportsTitle"
      [loading]="store.loading()"
      [empty]="isEmpty()"
      [emptyMessage]="Labels.RentalDamageReportsEmpty"
      (expandedChange)="onExpanded($event)"
    >
      <a
        actions
        mat-icon-button
        class="icon-btn-sm"
        [routerLink]="'/damage-reports'"
        [queryParams]="queryParams()"
        [attr.aria-label]="Labels.OpenDamageReportsList"
        [title]="Labels.OpenDamageReportsList"
      >
        <mat-icon class="!text-base">open_in_new</mat-icon>
      </a>
      <div class="flex flex-col gap-1">
        @for (report of store.items(); track report.id) {
          <app-damage-report-list-item [report]="report" />
        }
      </div>
    </app-collapsible-section>
  `,
})
export class RentalDamageReportsSectionComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(DamageReportStore);

  private readonly rentalStore = inject(RentalStore);

  protected readonly queryParams = computed(() => ({
    rentalId: String(this.rentalStore.id() ?? ''),
  }));
  private loadedForRentalId: number | null = null;

  protected readonly isEmpty = computed(
    () => !this.store.loading() && this.store.items().length === 0,
  );

  protected onExpanded(expanded: boolean): void {
    if (!expanded) return;
    const rentalId = this.rentalStore.id();
    if (rentalId === null || this.loadedForRentalId === rentalId) return;
    this.loadedForRentalId = rentalId;
    this.store.search({ rentalId, pageIndex: 0, pageSize: REPORTS_PAGE_SIZE });
  }
}
