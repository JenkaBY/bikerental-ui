import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  ApiErrorParser,
  CLIENT_STATUSES,
  ClientRegistryStore,
  ErrorMessageResolver,
  Labels,
} from '@bikerental/shared';
import type { Client, ClientStatus, ClientSummary } from '@bikerental/shared';
import { CLIENT_STATUS_LABELS, ClientStatusBadgeComponent } from './client-status-badge.component';
import { ClientFormDialogComponent } from './client-form-dialog.component';
import type { ClientFormDialogData } from './client-form-dialog.component';

const SEARCH_MAX = 100;

@Component({
  selector: 'app-clients-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressBarModule,
    ClientStatusBadgeComponent,
  ],
  templateUrl: './clients-list.component.html',
})
export class ClientsListComponent implements OnInit {
  protected readonly Labels = Labels;
  protected readonly store = inject(ClientRegistryStore);
  protected readonly statuses = CLIENT_STATUSES;
  protected readonly statusLabels = CLIENT_STATUS_LABELS;
  protected readonly searchMax = SEARCH_MAX;
  protected readonly displayedColumns = [
    'slug',
    'displayName',
    'legalName',
    'currency',
    'status',
    'createdAt',
  ];
  protected readonly search = new FormControl(this.store.query().query, { nonNullable: true });

  private readonly resolver = inject(ErrorMessageResolver);
  private readonly dialog = inject(MatDialog);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.store.reload();
    this.search.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.store.setText(value.slice(0, SEARCH_MAX)));
  }

  protected listErrorMessage(): string {
    const err = this.store.listError();
    return err ? this.resolver.resolve(ApiErrorParser.parse(err)) : '';
  }

  protected onStatus(status: ClientStatus | null): void {
    this.store.setStatus(status);
  }

  protected onPage(event: PageEvent): void {
    this.store.setPage(event.pageIndex, event.pageSize);
  }

  protected open(row: ClientSummary): void {
    void this.router.navigate(['clients', row.slug]);
  }

  protected openRegisterDialog(): void {
    this.dialog
      .open<ClientFormDialogComponent, ClientFormDialogData, Client>(ClientFormDialogComponent, {
        data: {},
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((client) => {
        if (client) void this.router.navigate(['clients', client.slug]);
      });
  }
}
