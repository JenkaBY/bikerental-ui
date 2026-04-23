import { buildTooltipLines } from './health-tooltip-lines.builder';
import { HealthResponse, ServerInfo } from '../../../core/health/health.model';

type Health = Pick<HealthResponse, 'status' | 'components'> & { error?: string | null };

const BASE_HEALTH: Health = { status: 'UP', components: undefined, error: null };
const BASE_INFO: ServerInfo = {};
const BASE_DATE: Date | null = null;

describe('buildTooltipLines', () => {
  it('always includes the status line', () => {
    const lines = buildTooltipLines({ ...BASE_HEALTH, status: 'DOWN' }, BASE_INFO, BASE_DATE);
    expect(lines.find((l) => l.id === 'status')?.value).toBe('DOWN');
  });

  it.each<[string, Health, ServerInfo, Date | null, string, string]>([
    ['name', BASE_HEALTH, { build: { name: 'Bike Rental API' } }, null, 'name', 'Bike Rental API'],
    ['version', BASE_HEALTH, { build: { version: '1.0.0' } }, null, 'version', '1.0.0'],
    ['commit', BASE_HEALTH, { build: { git: { commit: 'abc123' } } }, null, 'commit', 'abc123'],
    [
      'build-time',
      BASE_HEALTH,
      { build: { time: '2026-03-05T09:45:37.000Z' } },
      null,
      'build-time',
      '2026',
    ],
    [
      'last-checked',
      BASE_HEALTH,
      BASE_INFO,
      new Date(2026, 2, 6, 10, 0, 0),
      'last-checked',
      '10:00:00',
    ],
    [
      'error',
      { ...BASE_HEALTH, error: 'Unable to reach server' },
      BASE_INFO,
      null,
      'error',
      'Unable to reach server',
    ],
  ])('includes %s line when provided', async (_, health, serverInfo, lastChecked, id, expected) => {
    const lines = buildTooltipLines(health, serverInfo, lastChecked);
    expect(lines.find((l) => l.id === id)?.value).toContain(expected);
  });

  it.each<[string, Partial<ServerInfo['build']> | null]>([
    ['name', { version: '1.0.0' }],
    ['version', { name: 'App' }],
    ['commit', { name: 'App' }],
    ['build-time', { name: 'App' }],
  ])('%s line is null when not in serverInfo', (id, build) => {
    const lines = buildTooltipLines(BASE_HEALTH, build ? { build } : {}, null);
    expect(lines.find((l) => l.id === id)?.value).toBeNull();
  });

  it('last-checked line is null when lastChecked is null', () => {
    const lines = buildTooltipLines(BASE_HEALTH, BASE_INFO, null);
    expect(lines.find((l) => l.id === 'last-checked')?.value).toBeNull();
  });

  it('error line is null when error is null', () => {
    const lines = buildTooltipLines({ ...BASE_HEALTH, error: null }, BASE_INFO, null);
    expect(lines.find((l) => l.id === 'error')?.value).toBeNull();
  });

  it('does not append components section when status is UP', () => {
    const lines = buildTooltipLines(
      { status: 'UP', components: { db: { status: 'DOWN' } } },
      BASE_INFO,
      null,
    );
    expect(lines.find((l) => l.id === 'components-header')).toBeUndefined();
    expect(lines.find((l) => l.id === 'component-db')).toBeUndefined();
  });

  it('does not append components section when components is undefined', () => {
    const lines = buildTooltipLines({ status: 'DOWN', components: undefined }, BASE_INFO, null);
    expect(lines.find((l) => l.id === 'components-header')).toBeUndefined();
  });

  it('does not append components section when components is empty', () => {
    const lines = buildTooltipLines({ status: 'DOWN', components: {} }, BASE_INFO, null);
    expect(lines.find((l) => l.id === 'components-header')).toBeUndefined();
  });

  it('appends components-header with separator when status is DOWN and components exist', () => {
    const lines = buildTooltipLines(
      { status: 'DOWN', components: { db: { status: 'DOWN' } } },
      BASE_INFO,
      null,
    );
    const header = lines.find((l) => l.id === 'components-header');
    expect(header?.separator).toBe(true);
  });

  it('appends one line per component entry', () => {
    const lines = buildTooltipLines(
      { status: 'DOWN', components: { db: { status: 'DOWN' }, diskSpace: { status: 'UP' } } },
      BASE_INFO,
      null,
    );
    expect(lines.find((l) => l.id === 'component-db')?.value).toBe('DOWN');
    expect(lines.find((l) => l.id === 'component-diskSpace')?.value).toBe('UP');
  });

  it('appends components section for OUT_OF_SERVICE status', () => {
    const lines = buildTooltipLines(
      { status: 'OUT_OF_SERVICE', components: { cache: { status: 'OUT_OF_SERVICE' } } },
      BASE_INFO,
      null,
    );
    expect(lines.find((l) => l.id === 'component-cache')?.value).toBe('OUT_OF_SERVICE');
  });
});
