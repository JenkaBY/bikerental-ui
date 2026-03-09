import { TestBed } from '@angular/core/testing';
import { HealthPollerService } from './health-poller.service';
import { HealthService } from './health.service';

class MockHealthService {
  called = 0;
  checkHealth() {
    this.called++;
  }
}

describe('HealthPollerService', () => {
  let mock: MockHealthService;
  beforeEach(() => {
    mock = new MockHealthService();
    TestBed.configureTestingModule({ providers: [{ provide: HealthService, useValue: mock }] });
  });

  it('should call checkHealth immediately on construction', () => {
    TestBed.inject(HealthPollerService);
    expect(mock.called).toBeGreaterThanOrEqual(1);
  });
});
