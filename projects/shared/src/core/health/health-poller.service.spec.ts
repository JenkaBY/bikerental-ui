import { TestBed } from '@angular/core/testing';
import { HealthPollerService } from './health-poller.service';
import { HealthService } from './health.service';

describe('HealthPollerService', () => {
  it('calls checkHealth on the injected HealthService when constructed', async () => {
    const checkHealth = vi.fn();
    const mockHealth = { checkHealth } as unknown as HealthService;

    await TestBed.configureTestingModule({
      providers: [{ provide: HealthService, useValue: mockHealth }, HealthPollerService],
    }).compileComponents();

    TestBed.inject(HealthPollerService);

    expect(checkHealth).toHaveBeenCalled();
  });
});
