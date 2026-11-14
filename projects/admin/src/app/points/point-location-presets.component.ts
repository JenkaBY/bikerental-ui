import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  BusinessLocationStore,
  formatGeoLocation,
  type GeoLocation,
  Labels,
  PointAdminStore,
} from '@bikerental/shared';

export interface PointLocationPreset {
  readonly location: GeoLocation;
  readonly timeZone: string | null;
  readonly business: boolean;
  readonly label: string;
}

export interface PointLocationPresetChoice {
  readonly preset: PointLocationPreset;
  readonly auto: boolean;
}

@Component({
  selector: 'app-point-location-presets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule, MatButtonModule, MatIconModule],
  template: `
    @if (presets().length) {
      <div class="flex items-start gap-4">
        <mat-form-field appearance="outline" class="flex-1" subscriptSizing="dynamic">
          <mat-label>{{ labels.PointSavedAddresses }}</mat-label>
          <mat-select (selectionChange)="pick($event.value, false)">
            @for (preset of presets(); track preset.location.id) {
              <mat-option [value]="preset">
                {{ preset.label }}
                @if (preset.business) {
                  <span class="text-xs text-slate-500">· {{ labels.PointBusinessAddressTag }}</span>
                }
              </mat-option>
            }
          </mat-select>
        </mat-form-field>
        @if (businessPreset(); as preset) {
          <button mat-stroked-button type="button" class="!mt-2" (click)="pick(preset, false)">
            <mat-icon>business</mat-icon>
            {{ labels.PointUseBusinessAddress }}
          </button>
        }
      </div>
    }
  `,
})
export class PointLocationPresetsComponent {
  protected readonly labels = Labels;

  readonly autoApplyBusiness = input(false);
  readonly chosen = output<PointLocationPresetChoice>();

  private readonly points = inject(PointAdminStore);
  private readonly business = inject(BusinessLocationStore);
  private autoApplied = false;

  protected readonly businessPreset = computed<PointLocationPreset | null>(() => {
    const location = this.business.location();
    if (!location) return null;
    return {
      location,
      timeZone: this.business.timeZone(),
      business: true,
      label: formatGeoLocation(location),
    };
  });

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
    const businessPreset = this.businessPreset();
    if (businessPreset) add(businessPreset);
    for (const point of this.points.points()) {
      const location = point.geoLocationId ? locations.get(point.geoLocationId) : undefined;
      if (location) {
        add({
          location,
          timeZone: point.timeZone,
          business: false,
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
    effect(() => {
      const preset = this.businessPreset();
      if (!this.autoApplyBusiness() || !preset || this.autoApplied) return;
      this.autoApplied = true;
      untracked(() => this.pick(preset, true));
    });
  }

  protected pick(preset: PointLocationPreset, auto: boolean): void {
    this.chosen.emit({ preset, auto });
  }
}
