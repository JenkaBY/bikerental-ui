import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import {
  ClientPointsStore,
  GeoLocationLookupStore,
  Labels,
  PageHeaderComponent,
} from '@bikerental/shared';
import type { PointStatus } from '@bikerental/shared';

const STATUS_LABELS: Record<PointStatus, string> = {
  ACTIVE: Labels.PointStatusActive,
  INACTIVE: Labels.PointStatusInactive,
  PERMANENTLY_CLOSED: Labels.PointStatusClosed,
};

const STATUS_CLASSES: Record<PointStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-slate-100 text-slate-700',
  PERMANENTLY_CLOSED: 'bg-red-100 text-red-800',
};

@Component({
  selector: 'app-client-points',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ClientPointsStore],
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatSelectModule,
    MatTableModule,
    PageHeaderComponent,
  ],
  templateUrl: './client-points.component.html',
})
export class ClientPointsComponent {
  readonly slug = input.required<string>();

  protected readonly Labels = Labels;
  protected readonly store = inject(ClientPointsStore);
  protected readonly lookup = inject(GeoLocationLookupStore);
  protected readonly statuses = Object.keys(STATUS_LABELS) as PointStatus[];
  protected readonly displayedColumns = ['name', 'slug', 'location', 'timeZone', 'status'];

  private readonly router = inject(Router);

  constructor() {
    effect(() => {
      const slug = this.slug();
      untracked(() => this.store.load(slug));
    });
  }

  protected statusLabel(status: PointStatus): string {
    return STATUS_LABELS[status];
  }

  protected statusClass(status: PointStatus): string {
    return STATUS_CLASSES[status];
  }

  protected onStatusChange(status: PointStatus | null): void {
    this.store.setStatus(status);
  }

  protected onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex, event.pageSize);
  }

  protected back(): void {
    void this.router.navigate(['clients', this.slug()]);
  }
}
