import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ApiErrorParser,
  AuthService,
  ConfirmDialogComponent,
  ErrorMessageResolver,
  Labels,
  NotificationService,
  PlatformManagerStore,
  suppressErrorNotification,
} from '@bikerental/shared';
import type { ConfirmDialogData, PlatformManager } from '@bikerental/shared';
import { ManagerCreateDialogComponent } from './manager-create-dialog.component';

@Component({
  selector: 'app-managers-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  templateUrl: './managers-list.component.html',
})
export class ManagersListComponent implements OnInit {
  protected readonly Labels = Labels;
  protected readonly store = inject(PlatformManagerStore);
  protected readonly displayedColumns = [
    'username',
    'email',
    'displayName',
    'status',
    'created',
    'lastLogin',
    'actions',
  ];
  protected readonly busy = signal<Record<string, boolean>>({});

  private readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);

  private readonly currentUserId = computed(() => this.auth.uid());

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.store
      .load({ context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: (err) => this.showError(err) });
  }

  isOwnAccount(row: PlatformManager): boolean {
    return row.id === this.currentUserId();
  }

  canDeactivate(row: PlatformManager): boolean {
    return row.status === 'ACTIVE' && !this.isOwnAccount(row) && !this.busy()[row.id];
  }

  openCreateDialog(): void {
    this.dialog
      .open<ManagerCreateDialogComponent, unknown, boolean>(ManagerCreateDialogComponent, {
        data: {},
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created) => {
        if (created) {
          this.load();
        }
      });
  }

  onDeactivate(row: PlatformManager): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: Labels.DeactivatePlatformManagerDialogTitle,
          message: Labels.DeactivatePlatformManagerDialogMessage,
          confirmLabel: Labels.DeactivateUserConfirmButton,
          cancelLabel: Labels.Cancel,
          danger: true,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.deactivate(row.id);
        }
      });
  }

  private deactivate(id: string): void {
    this.busy.update((s) => ({ ...s, [id]: true }));
    this.store
      .deactivate(id, { context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.busy.update((s) => ({ ...s, [id]: false })),
        error: (err) => {
          this.busy.update((s) => ({ ...s, [id]: false }));
          this.showError(err);
        },
      });
  }

  private showError(err: unknown): void {
    this.notifications.error(this.resolver.resolve(ApiErrorParser.parse(err)));
  }
}
