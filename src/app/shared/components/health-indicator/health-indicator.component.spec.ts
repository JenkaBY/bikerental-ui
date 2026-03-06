import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID, signal } from '@angular/core';
import { HealthIndicatorComponent } from './health-indicator.component';
import { HealthService } from '../../../core/health/health.service';
import { HealthStatus } from '../../../core/health/health.model';

function makeHealthService(
  overrides: Partial<{
    status: HealthStatus;
    serverInfo: {
      build?: { version?: string; name?: string; git?: { commit?: string }; time?: string };
    } | null;
    lastChecked: Date | null;
    components: Record<string, { status: HealthStatus }> | null;
    error: string | null;
  }> = {},
) {
  return {
    status: signal<HealthStatus>(overrides.status ?? 'UNKNOWN'),
    serverInfo: signal(overrides.serverInfo ?? null),
    lastChecked: signal(overrides.lastChecked ?? null),
    components: signal(overrides.components ?? null),
    error: signal(overrides.error ?? null),
  };
}

describe('HealthIndicatorComponent', () => {
  let fixture: ComponentFixture<HealthIndicatorComponent>;

  async function setup(overrides = {}) {
    await TestBed.configureTestingModule({
      imports: [HealthIndicatorComponent],
      providers: [
        { provide: HealthService, useValue: makeHealthService(overrides) },
        { provide: LOCALE_ID, useValue: 'ru' },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HealthIndicatorComponent);
    fixture.detectChanges();
  }

  it.each<[HealthStatus, string]>([
    ['UP', 'bg-green-500'],
    ['DOWN', 'bg-red-500'],
    ['OUT_OF_SERVICE', 'bg-yellow-500'],
    ['UNKNOWN', 'bg-gray-400'],
  ])('dot should be %s → %s', async (status, cssClass) => {
    await setup({ status });
    const dot: HTMLElement = fixture.nativeElement.querySelector('span.rounded-full');
    expect(dot.classList).toContain(cssClass);
  });

  it('should show --:--:-- when lastChecked is null', async () => {
    await setup({ lastChecked: null });
    const ts: HTMLElement = fixture.nativeElement.querySelector('span.tabular-nums');
    expect(ts.textContent?.trim()).toBe('--:--:--');
  });

  it('should show formatted HH:mm:ss when lastChecked is set', async () => {
    await setup({ lastChecked: new Date(2026, 2, 5, 14, 32, 5) });
    const ts: HTMLElement = fixture.nativeElement.querySelector('span.tabular-nums');
    expect(ts.textContent?.trim()).toMatch(/\d{2}:\d{2}:\d{2}/);
  });

  it('overlay is closed by default', async () => {
    await setup();
    const instance = fixture.componentInstance as unknown as { isOpen: () => boolean };
    expect(instance.isOpen()).toBe(false);
  });

  it('overlay opens on mouseenter and closes on mouseleave', async () => {
    await setup();
    const dot: HTMLElement = fixture.nativeElement.querySelector('span.rounded-full');
    const instance = fixture.componentInstance as unknown as { isOpen: () => boolean };
    dot.dispatchEvent(new MouseEvent('mouseenter'));
    expect(instance.isOpen()).toBe(true);
    dot.dispatchEvent(new MouseEvent('mouseleave'));
    expect(instance.isOpen()).toBe(false);
  });

  it('lines includes all serverInfo fields when build info is fully populated', async () => {
    await setup({
      status: 'UP',
      serverInfo: {
        build: {
          name: 'Bike Rental API',
          version: '1.0.0',
          git: { commit: 'abc123' },
          time: '2026-03-05T09:45:37.666Z',
        },
      },
    });
    const instance = fixture.componentInstance as unknown as {
      lines: () => { id: string; value: string | null }[];
    };
    const lines = instance.lines();
    expect(lines.find((l) => l.id === 'name')?.value).toBe('Bike Rental API');
    expect(lines.find((l) => l.id === 'version')?.value).toBe('1.0.0');
    expect(lines.find((l) => l.id === 'commit')?.value).toBe('abc123');
    expect(lines.find((l) => l.id === 'build-time')?.value).toContain('2026');
  });

  it('lines includes lastChecked when set', async () => {
    await setup({ status: 'UP', lastChecked: new Date(2026, 2, 6, 10, 0, 0) });
    const instance = fixture.componentInstance as unknown as {
      lines: () => { id: string; value: string | null }[];
    };
    expect(instance.lines().find((l) => l.id === 'last-checked')?.value).toMatch(
      /\d{2}:\d{2}:\d{2}/,
    );
  });

  it('lines has null for all serverInfo fields when serverInfo is null', async () => {
    await setup({ status: 'UP', serverInfo: null });
    const instance = fixture.componentInstance as unknown as {
      lines: () => { id: string; value: string | null }[];
    };
    const lines = instance.lines();
    expect(lines.find((l) => l.id === 'name')?.value).toBeNull();
    expect(lines.find((l) => l.id === 'version')?.value).toBeNull();
    expect(lines.find((l) => l.id === 'commit')?.value).toBeNull();
    expect(lines.find((l) => l.id === 'build-time')?.value).toBeNull();
  });
});
