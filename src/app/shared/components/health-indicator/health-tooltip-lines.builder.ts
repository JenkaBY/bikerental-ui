import { HealthResponse, ServerInfo } from '../../../core/health/health.model';
import { TooltipLine } from './health-tooltip.component';

export type TooltipLineId =
  | 'status'
  | 'name'
  | 'version'
  | 'commit'
  | 'build-time'
  | 'last-checked'
  | 'error'
  | 'components-header';

export const TOOLTIP_LINE_LABELS: Record<TooltipLineId, string> = {
  status: $localize`:@@health-indicator.tooltip.status:Status`,
  name: $localize`:@@health-indicator.tooltip.name:Application`,
  version: $localize`:@@health-indicator.tooltip.version:Version`,
  commit: $localize`:@@health-indicator.tooltip.commit:Commit`,
  'build-time': $localize`:@@health-indicator.tooltip.build-time:Build`,
  'last-checked': $localize`:@@health-indicator.tooltip.last-checked:Checked`,
  error: $localize`:@@health-indicator.tooltip.error:Error`,
  'components-header': $localize`:@@health-indicator.tooltip.components:Components`,
};

export function buildTooltipLines(
  health: Pick<HealthResponse, 'status' | 'components'> & { error?: string | null },
  serverInfo: ServerInfo | null,
  lastChecked: Date | null,
  locale?: string,
): TooltipLine[] {
  const build = serverInfo?.build;
  const { status, components, error } = health;

  const values: Record<TooltipLineId, string | null> = {
    status,
    name: build?.name ?? null,
    version: build?.version ?? null,
    commit: build?.git?.commit ?? null,
    'build-time': build?.time ? new Date(build.time).toLocaleString(locale) : null,
    'last-checked': lastChecked ? lastChecked.toLocaleTimeString(locale) : null,
    error: error ?? null,
    'components-header': null,
  };

  const lines: TooltipLine[] = (Object.keys(TOOLTIP_LINE_LABELS) as TooltipLineId[])
    .filter((id) => id !== 'components-header')
    .map((id) => ({ id, label: TOOLTIP_LINE_LABELS[id], value: values[id] }));

  if (status !== 'UP' && components && Object.keys(components).length > 0) {
    lines.push({
      id: 'components-header',
      label: TOOLTIP_LINE_LABELS['components-header'],
      value: '',
      separator: true,
    });
    for (const [name, comp] of Object.entries(components)) {
      lines.push({ id: `component-${name}`, label: name, value: comp.status });
    }
  }

  return lines;
}
