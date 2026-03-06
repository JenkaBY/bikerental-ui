import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  LOCALE_ID,
  signal,
} from '@angular/core';
import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { HealthService } from '../../../core/health/health.service';
import { HealthTooltipComponent, TooltipLine } from './health-tooltip.component';
import { buildTooltipLines } from './health-tooltip-lines.builder';
import { HealthStatus } from '../../../core/health/health.model';

const DOT_CLASSES: Record<HealthStatus, string> = {
  UP: 'bg-green-500',
  DOWN: 'bg-red-500',
  OUT_OF_SERVICE: 'bg-yellow-500',
  UNKNOWN: 'bg-gray-400',
};

const OVERLAY_POSITIONS: ConnectedPosition[] = [
  { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: 6 },
  { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -6 },
];

@Component({
  selector: 'app-health-indicator',
  standalone: true,
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, HealthTooltipComponent],
  templateUrl: './health-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HealthIndicatorComponent {
  private readonly healthService = inject(HealthService);
  private readonly locale = inject(LOCALE_ID);

  protected readonly overlayPositions = OVERLAY_POSITIONS;
  protected readonly isOpen = signal(false);

  protected readonly dotClass = computed(() => DOT_CLASSES[this.healthService.status()]);

  protected readonly checkedAt = computed(() => {
    const date = this.healthService.lastChecked();
    if (!date) return '--:--:--';
    return date.toLocaleTimeString(this.locale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });

  protected readonly lines = computed<TooltipLine[]>(() =>
    buildTooltipLines(
      {
        status: this.healthService.status(),
        components: this.healthService.components() ?? undefined,
        error: this.healthService.error(),
      },
      this.healthService.serverInfo(),
      this.healthService.lastChecked(),
      this.locale,
    ),
  );

  protected open(): void {
    this.isOpen.set(true);
  }

  protected close(): void {
    this.isOpen.set(false);
  }
}
