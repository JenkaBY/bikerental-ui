import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type NotificationSeverity = 'success' | 'info' | 'warn' | 'error';

const DEFAULT_DURATIONS: Record<NotificationSeverity, number> = {
  success: 3000,
  info: 3000,
  warn: 4000,
  error: 5000,
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly snackBar = inject(MatSnackBar);
  private readonly close = $localize`Close`;

  success(message: string, config?: MatSnackBarConfig): void {
    this.show('success', message, config);
  }

  info(message: string, config?: MatSnackBarConfig): void {
    this.show('info', message, config);
  }

  warn(message: string, config?: MatSnackBarConfig): void {
    this.show('warn', message, config);
  }

  error(message: string, config?: MatSnackBarConfig): void {
    this.show('error', message, config);
  }

  private show(severity: NotificationSeverity, message: string, config?: MatSnackBarConfig): void {
    this.snackBar.open(message, this.close, {
      duration: DEFAULT_DURATIONS[severity],
      panelClass: [`snackbar-${severity}`],
      ...config,
    });
  }
}
