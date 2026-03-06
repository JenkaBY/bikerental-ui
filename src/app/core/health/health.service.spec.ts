import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HealthService } from './health.service';
import { HealthResponse, ServerInfo } from './health.model';

const HEALTH_URL = 'http://localhost:8080/actuator/health';
const INFO_URL = 'http://localhost:8080/actuator/info';

describe('HealthService', () => {
  let service: HealthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), HealthService],
    });
    service = TestBed.inject(HealthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should set status to UNKNOWN initially', () => {
    expect(service.status()).toBe('UNKNOWN');
  });

  it('should update status and lastChecked on successful health check', () => {
    service.checkHealth();

    httpMock.expectOne(HEALTH_URL).flush({ status: 'DOWN' } satisfies HealthResponse);

    expect(service.status()).toBe('DOWN');
    expect(service.lastChecked()).toBeInstanceOf(Date);
  });

  it('should fetch /actuator/info once when status first becomes UP', () => {
    const mockInfo: ServerInfo = { build: { version: 'commit: abc123' } };

    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).flush({ status: 'UP' } satisfies HealthResponse);
    httpMock.expectOne(INFO_URL).flush(mockInfo);

    expect(service.serverInfo()?.build?.version).toBe('commit: abc123');
  });

  it('should NOT fetch /actuator/info again on subsequent UP polls', () => {
    const mockInfo: ServerInfo = { build: { version: 'commit: abc123' } };

    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).flush({ status: 'UP' } satisfies HealthResponse);
    httpMock.expectOne(INFO_URL).flush(mockInfo);

    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).flush({ status: 'UP' } satisfies HealthResponse);
    httpMock.expectNone(INFO_URL);
  });

  it('should NOT fetch /actuator/info on DOWN → UP when serverInfo already loaded', () => {
    const mockInfo: ServerInfo = { build: { version: 'commit: abc123' } };

    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).flush({ status: 'UP' } satisfies HealthResponse);
    httpMock.expectOne(INFO_URL).flush(mockInfo);

    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).flush({ status: 'DOWN' } satisfies HealthResponse);

    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).flush({ status: 'UP' } satisfies HealthResponse);
    httpMock.expectNone(INFO_URL);
  });

  it('should set status to UNKNOWN and error when health endpoint fails', () => {
    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'));

    expect(service.status()).toBe('UNKNOWN');
    expect(service.error()).toBe('Unable to reach server');
  });

  it('should store components from health response', () => {
    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).flush({
      status: 'DOWN',
      components: { db: { status: 'DOWN' }, diskSpace: { status: 'UP' } },
    } satisfies HealthResponse);

    expect(service.components()?.['db']?.status).toBe('DOWN');
    expect(service.components()?.['diskSpace']?.status).toBe('UP');
  });

  it('should silently ignore /actuator/info failure', () => {
    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).flush({ status: 'UP' } satisfies HealthResponse);
    httpMock.expectOne(INFO_URL).error(new ProgressEvent('error'));

    expect(service.serverInfo()).toBeNull();
  });

  it('should set components to null when response has no components field', () => {
    service.checkHealth();
    httpMock
      .expectOne(HEALTH_URL)
      .flush({ status: 'UP', groups: ['liveness'] } satisfies HealthResponse);
    httpMock.expectOne(INFO_URL).flush({});

    expect(service.components()).toBeNull();
  });

  it('should clear error signal on successful health response', () => {
    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'));
    expect(service.error()).toBe('Unable to reach server');

    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).flush({ status: 'UP' } satisfies HealthResponse);
    httpMock.expectOne(INFO_URL).flush({});

    expect(service.error()).toBeNull();
  });

  it('should set lastChecked even when health endpoint errors', () => {
    service.checkHealth();
    httpMock.expectOne(HEALTH_URL).error(new ProgressEvent('error'));

    expect(service.lastChecked()).toBeInstanceOf(Date);
  });
});
