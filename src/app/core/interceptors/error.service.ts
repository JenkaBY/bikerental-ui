import { inject, Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface AppError {
  title: string;
  detail: string;
  status: number;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly lastError = signal<AppError | null>(null);
  private snackBar = inject(MatSnackBar);

  handleError(error: HttpErrorResponse): void {
    const err =
      error.error && typeof error.error === 'object' && 'title' in error.error
        ? {
            title: error.error.title ?? 'Error',
            detail: error.error.detail ?? '',
            status: error.error.status ?? error.status,
          }
        : { title: `HTTP Error ${error.status}`, detail: error.message, status: error.status };
    this.setError(err);
    this.snackBar.open(this.getHttpMessage(error), $localize`Close`, { duration: 4000 });
  }

  setError(error: AppError): void {
    this.lastError.set(error);
  }

  clearError(): void {
    this.lastError.set(null);
  }

  private getHttpMessage(error: HttpErrorResponse): string {
    switch (error.status) {
      case 400:
        return 'Bad Request';
      case 401:
        return 'Unauthorized';
      case 403:
        return 'Forbidden';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Unprocessable entity';
      case 500:
        return 'Internal Server Error';
      default:
        return 'Unexpected error occurred';
    }
  }
}
