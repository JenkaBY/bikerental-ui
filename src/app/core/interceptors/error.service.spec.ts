import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorService } from './error.service';

function makeSnackBar() {
  return { open: vi.fn() };
}

describe('ErrorService', () => {
  let service: ErrorService;
  let snackBar: ReturnType<typeof makeSnackBar>;

  beforeEach(() => {
    snackBar = makeSnackBar();
    TestBed.configureTestingModule({
      providers: [ErrorService, { provide: MatSnackBar, useValue: snackBar }],
    });
    service = TestBed.inject(ErrorService);
  });

  it('should set and clear error', () => {
    expect(service.lastError()).toBeNull();
    const e = { title: 'T', detail: 'D', status: 400 } as const;
    service.setError(e);
    expect(service.lastError()).toEqual(e);
    service.clearError();
    expect(service.lastError()).toBeNull();
  });

  it('handleError extracts title/detail from structured error body', () => {
    const err = new HttpErrorResponse({
      status: 422,
      error: { title: 'Validation failed', detail: 'Field X invalid', status: 422 },
    });
    service.handleError(err);
    expect(service.lastError()).toEqual({
      title: 'Validation failed',
      detail: 'Field X invalid',
      status: 422,
    });
    expect(snackBar.open).toHaveBeenCalledWith(
      'Unprocessable entity',
      expect.anything(),
      expect.anything(),
    );
  });

  it('handleError falls back to HTTP status message for plain error', () => {
    const err = new HttpErrorResponse({ status: 500, error: 'plain string' });
    service.handleError(err);
    expect(service.lastError()?.title).toBe('HTTP Error 500');
    expect(snackBar.open).toHaveBeenCalledWith(
      'Internal Server Error',
      expect.anything(),
      expect.anything(),
    );
  });

  it('handleError uses fallback defaults when structured fields are missing', () => {
    const err = new HttpErrorResponse({
      status: 400,
      error: { title: undefined, detail: undefined, status: undefined },
    });
    service.handleError(err);
    expect(service.lastError()?.title).toBe('Error');
    expect(service.lastError()?.detail).toBe('');
    expect(snackBar.open).toHaveBeenCalledWith('Bad Request', expect.anything(), expect.anything());
  });

  it.each([
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [409, 'Conflict'],
    [422, 'Unprocessable entity'],
    [500, 'Internal Server Error'],
    [503, 'Unexpected error occurred'],
  ])('getHttpMessage returns correct text for status %i', (status, expected) => {
    const err = new HttpErrorResponse({ status, error: 'e' });
    service.handleError(err);
    expect(snackBar.open).toHaveBeenCalledWith(expected, expect.anything(), expect.anything());
  });
});
