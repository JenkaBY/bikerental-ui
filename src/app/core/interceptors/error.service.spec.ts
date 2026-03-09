import { TestBed } from '@angular/core/testing';
import { ErrorService } from './error.service';

describe('ErrorService', () => {
  let service: ErrorService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ErrorService] });
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
});
