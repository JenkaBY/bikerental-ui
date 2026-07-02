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
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ApiErrorParser,
  ConfirmDialogComponent,
  ErrorMessageResolver,
  Labels,
  ManagedUserStore,
  NotificationService,
  ROLE_LABELS,
  suppressErrorNotification,
  TemporaryPasswordDialogComponent,
  UserStore,
} from '@bikerental/shared';
import type { ConfirmDialogData, TemporaryPasswordDialogData } from '@bikerental/shared';
import type { ManagedUser } from '@ui-models';
import type { Role } from '@bikerental/shared';
import { UserCreateDialogComponent } from './user-create-dialog.component';
import { UserEditDialogComponent } from './user-edit-dialog.component';

@Component({
  selector: 'app-users-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressBarModule,
  ],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ Labels.UsersListTitle }}</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <div class="flex justify-start mb-2">
          <button mat-raised-button color="primary" (click)="openCreateDialog()">
            <mat-icon>add</mat-icon>
            <span>{{ Labels.NewUserButton }}</span>
          </button>
        </div>

        @if (store.loading()) {
          <mat-progress-bar mode="indeterminate" />
        }

        @if (!store.loading() && store.users().length > 0) {
          <table mat-table [dataSource]="store.users()" class="w-full">
            <ng-container matColumnDef="username">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnUsername }}</th>
              <td mat-cell *matCellDef="let row">{{ row.username }}</td>
            </ng-container>

            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnEmail }}</th>
              <td mat-cell *matCellDef="let row">{{ row.email }}</td>
            </ng-container>

            <ng-container matColumnDef="displayName">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnDisplayName }}</th>
              <td mat-cell *matCellDef="let row">{{ row.displayName }}</td>
            </ng-container>

            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnRoles }}</th>
              <td mat-cell *matCellDef="let row">
                <mat-chip-set>
                  @for (role of row.roles; track role) {
                    <mat-chip>{{ getRoleLabel(role) }}</mat-chip>
                  }
                </mat-chip-set>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnStatus }}</th>
              <td mat-cell *matCellDef="let row">
                <span
                  class="px-2 py-1 rounded text-xs font-medium"
                  [class.bg-green-100]="row.status === 'ACTIVE'"
                  [class.text-green-800]="row.status === 'ACTIVE'"
                  [class.bg-red-100]="row.status === 'DISABLED'"
                  [class.text-red-800]="row.status === 'DISABLED'"
                >
                  {{
                    row.status === 'ACTIVE' ? Labels.UserStatusActive : Labels.UserStatusDisabled
                  }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="lastLogin">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnLastLogin }}</th>
              <td mat-cell *matCellDef="let row">
                {{
                  row.lastLoginAt
                    ? (row.lastLoginAt | date: 'dd MMM yyyy HH:mm')
                    : Labels.UserLastLoginNever
                }}
              </td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>{{ Labels.UserColumnActions }}</th>
              <td mat-cell *matCellDef="let row">
                <div class="flex gap-1 items-center">
                  <button
                    mat-icon-button
                    [disabled]="isRowLocked(row)"
                    [matTooltip]="
                      isBootstrapAdmin(row) ? Labels.UserProtectedTooltip : Labels.UserEditTooltip
                    "
                    (click)="openEditDialog(row)"
                  >
                    <mat-icon>edit</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    [disabled]="isRowLocked(row) || toggling()[row.id]"
                    [matTooltip]="
                      isBootstrapAdmin(row)
                        ? Labels.UserProtectedTooltip
                        : Labels.UserResetPasswordTooltip
                    "
                    (click)="onResetPassword(row)"
                  >
                    <mat-icon>lock_reset</mat-icon>
                  </button>
                  <button
                    mat-icon-button
                    [disabled]="isRowLocked(row) || toggling()[row.id]"
                    [matTooltip]="
                      isBootstrapAdmin(row)
                        ? Labels.UserProtectedTooltip
                        : row.status === 'ACTIVE'
                          ? Labels.UserDeactivateTooltip
                          : Labels.UserActivateTooltip
                    "
                    (click)="onToggleStatus(row)"
                  >
                    <mat-icon>{{ row.status === 'ACTIVE' ? 'block' : 'check_circle' }}</mat-icon>
                  </button>
                </div>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let _row; columns: displayedColumns"></tr>
          </table>
        }

        @if (!store.loading() && store.users().length === 0) {
          <div class="text-sm text-slate-500 py-6">{{ Labels.UsersEmptyState }}</div>
        }
      </mat-card-content>
    </mat-card>
  `,
})
export class UsersListComponent implements OnInit {
  protected readonly Labels = Labels;
  protected readonly roleLabels = ROLE_LABELS;
  protected readonly store = inject(ManagedUserStore);
  protected readonly displayedColumns = [
    'username',
    'email',
    'displayName',
    'roles',
    'status',
    'lastLogin',
    'actions',
  ];
  protected readonly toggling = signal<Record<string, boolean>>({});

  private readonly userStore = inject(UserStore);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);

  private readonly currentUserId = computed(() => this.userStore.currentUser()?.id);
  private readonly bootstrapAdminUsername = 'admin';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.store
      .load()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (err) => {
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(this.resolver.resolve(apiError));
        },
      });
  }

  isOwnAccount(row: ManagedUser): boolean {
    return row.id === this.currentUserId();
  }

  isBootstrapAdmin(row: ManagedUser): boolean {
    return row.username === this.bootstrapAdminUsername;
  }

  isRowLocked(row: ManagedUser): boolean {
    return this.isOwnAccount(row) || this.isBootstrapAdmin(row);
  }

  getRoleLabel(role: Role): string {
    return this.roleLabels[role];
  }

  openCreateDialog(): void {
    this.dialog
      .open<UserCreateDialogComponent, unknown, boolean>(UserCreateDialogComponent, { data: {} })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((created) => {
        if (created) {
          this.load();
        }
      });
  }

  openEditDialog(row: ManagedUser): void {
    this.dialog
      .open<UserEditDialogComponent, unknown, boolean>(UserEditDialogComponent, {
        data: { user: row },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((updated) => {
        if (updated) {
          this.load();
        }
      });
  }

  onResetPassword(row: ManagedUser): void {
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data: {
          title: Labels.ResetPasswordDialogTitle,
          message: Labels.ResetPasswordDialogMessage,
          confirmLabel: Labels.ResetPasswordConfirmButton,
          cancelLabel: Labels.Cancel,
          danger: true,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this.resetPassword(row.id);
        }
      });
  }

  private resetPassword(id: string): void {
    this.toggling.update((s) => ({ ...s, [id]: true }));
    this.store
      .resetPassword(id, { context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.toggling.update((s) => ({ ...s, [id]: false }));
          this.dialog.open<TemporaryPasswordDialogComponent, TemporaryPasswordDialogData, void>(
            TemporaryPasswordDialogComponent,
            { data: { temporaryPassword: result.temporaryPassword }, disableClose: true },
          );
        },
        error: (err) => {
          this.toggling.update((s) => ({ ...s, [id]: false }));
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(this.resolver.resolve(apiError));
        },
      });
  }

  onToggleStatus(row: ManagedUser): void {
    if (row.status === 'ACTIVE') {
      this.dialog
        .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
          data: {
            title: Labels.DeactivateUserDialogTitle,
            message: Labels.DeactivateUserDialogMessage,
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
      return;
    }

    this.activate(row.id);
  }

  private activate(id: string): void {
    this.toggling.update((s) => ({ ...s, [id]: true }));
    this.store
      .update(id, { status: 'ACTIVE' }, { context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.toggling.update((s) => ({ ...s, [id]: false })),
        error: (err) => {
          this.toggling.update((s) => ({ ...s, [id]: false }));
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(this.resolver.resolve(apiError));
        },
      });
  }

  private deactivate(id: string): void {
    this.toggling.update((s) => ({ ...s, [id]: true }));
    this.store
      .deactivate(id, { context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => this.toggling.update((s) => ({ ...s, [id]: false })),
        error: (err) => {
          this.toggling.update((s) => ({ ...s, [id]: false }));
          const apiError = ApiErrorParser.parse(err);
          this.notifications.error(this.resolver.resolve(apiError));
        },
      });
  }
}
