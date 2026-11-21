import { ChangeDetectionStrategy, Component, computed, inject, output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { formatGeoLocation, type GeoLocation, Labels, PointAdminStore } from '@bikerental/shared';

export interface PointLocationPreset {
  readonly location: GeoLocation;
  readonly timeZone: string | null;
  readonly label: string;
}

export interface PointLocationPresetChoice {
  readonly preset: PointLocationPreset;
}

@Component({
  selector: 'app-point-location-presets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    @if (presets().length) {
      <div class="flex items-start gap-4">
        <mat-form-field
          appearance="outline"
          class="flex-1 min-w-0 max-w-xl"
          subscriptSizing="dynamic"
        >
          <mat-label>{{ labels.PointSavedAddresses }}</mat-label>
          <mat-select (selectionChange)="pick($event.value)">
            @for (preset of presets(); track preset.location.id) {
              <mat-option [value]="preset">
                {{ preset.label }}
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>
    }
  `,
})
export class PointLocationPresetsComponent {
  protected readonly labels = Labels;

  readonly chosen = output<PointLocationPresetChoice>();

  private readonly points = inject(PointAdminStore);

  protected readonly presets = computed<PointLocationPreset[]>(() => {
    const locations = this.points.locations();
    const result: PointLocationPreset[] = [];
    const seen = new Set<string>();
    const add = (preset: PointLocationPreset): void => {
      const key = preset.label.toLocaleLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(preset);
    };
    for (const point of this.points.points()) {
      const location = point.geoLocationId ? locations.get(point.geoLocationId) : undefined;
      if (location) {
        add({
          location,
          timeZone: point.timeZone,
          label: formatGeoLocation(location),
        });
      }
    }
    return result;
  });

  constructor() {
    this.points
      .load()
      .pipe(takeUntilDestroyed())
      .subscribe({ error: () => void 0 });
  }

  protected pick(preset: PointLocationPreset): void {
    this.chosen.emit({ preset });
  }
}
