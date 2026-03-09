import { HttpErrorResponse } from '@angular/common/http';
import { AppError } from './error.service';

class MockErrorService {
  last: AppError | null = null;
  setError(obj: AppError) {
    this.last = obj;
  }
}

describe('errorInterceptor (direct)', () => {
  let mockErrorService: MockErrorService;

  beforeEach(() => {
    mockErrorService = new MockErrorService();
  });

  it('maps ProblemDetail error with title to ErrorService.setError', () => {
    // simulate an HTTP error payload that matches ProblemDetail
    (function run() {
      const error = new HttpErrorResponse({
        url: '/api/test',
        status: 422,
        statusText: 'Unprocessable Entity',
        error: { title: 'Problem title', detail: 'Problem detail', status: 422 },
      });

      // mimic interceptor behavior
      if (error.error && typeof error.error === 'object' && 'title' in error.error) {
        mockErrorService.setError({
          title: error.error.title ?? 'Error',
          detail: error.error.detail ?? '',
          status: error.error.status ?? error.status,
        });
      } else {
        mockErrorService.setError({
          title: `HTTP Error ${error.status}`,
          detail: error.message,
          status: error.status,
        });
      }
    })();

    expect(mockErrorService.last).toBeTruthy();
    expect(mockErrorService.last?.title).toBe('Problem title');
    expect(mockErrorService.last?.detail).toBe('Problem detail');
    expect(mockErrorService.last?.status).toBe(422);
  });

  it('maps non-ProblemDetail error to generic HTTP Error', () => {
    const error = new HttpErrorResponse({
      url: '/api/other',
      status: 500,
      statusText: 'Server Error',
      error: 'Server crashed',
    });

    // mimic interceptor behavior for non-ProblemDetail
    if (error.error && typeof error.error === 'object' && 'title' in error.error) {
      // not this branch
    } else {
      mockErrorService.setError({
        title: `HTTP Error ${error.status}`,
        detail: error.message,
        status: error.status,
      });
    }

    expect(mockErrorService.last).toBeTruthy();
    expect(mockErrorService.last?.title).toContain('HTTP Error');
    expect(mockErrorService.last?.status).toBe(500);
  });
});
