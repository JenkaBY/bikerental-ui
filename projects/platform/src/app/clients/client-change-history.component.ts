import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  untracked,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { ClientChangeHistoryStore, Labels } from '@bikerental/shared';
import type { ClientChangeKind } from '@bikerental/shared';

const KIND_LABELS: Record<ClientChangeKind, string> = {
  REGISTERED: Labels.ClientHistoryKindRegistered,
  DETAILS_CHANGED: Labels.ClientHistoryKindDetailsChanged,
  STATUS_CHANGED: Labels.ClientHistoryKindStatusChanged,
};

@Component({
  selector: 'app-client-change-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ClientChangeHistoryStore],
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatTableModule,
  ],
  templateUrl: './client-change-history.component.html',
})
export class ClientChangeHistoryComponent {
  readonly slug = input.required<string>();
  readonly version = input<number>(0);

  protected readonly Labels = Labels;
  protected readonly store = inject(ClientChangeHistoryStore);
  protected readonly displayedColumns = ['changedAt', 'kind', 'author', 'fields'];

  constructor() {
    effect(() => {
      const slug = this.slug();
      this.version();
      untracked(() => this.store.load(slug));
    });
  }

  protected kindLabel(kind: ClientChangeKind): string {
    return KIND_LABELS[kind];
  }

  protected onPageChange(event: PageEvent): void {
    this.store.setPage(event.pageIndex, event.pageSize);
  }
}
