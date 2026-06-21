import { Injectable, signal } from '@angular/core';
import type { ApiError } from '../errors/api-error.model';

@Injectable({ providedIn: 'root' })
export class ErrorService {
  readonly lastError = signal<ApiError | null>(null);

  setError(error: ApiError): void {
    this.lastError.set(error);
  }

  clearError(): void {
    this.lastError.set(null);
  }
}
