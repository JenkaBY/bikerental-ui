import { Injectable, signal } from '@angular/core';

export interface AppError {
  title: string;
  detail: string;
  status: number;
}

@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly lastError = signal<AppError | null>(null);

  setError(error: AppError): void {
    this.lastError.set(error);
  }

  clearError(): void {
    this.lastError.set(null);
  }
}
