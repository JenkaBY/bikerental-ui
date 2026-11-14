import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { GeoService } from '../../../core/api/geo/geo.service';
import type { GeoCountryTimeZone } from '../../../core/models/geo.model';
import { zoneWithOffset } from '../../business-setting.meta';
import { GeoControlBase } from './geo-control.base';

@Component({
  selector: 'app-time-zone-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ label() || labels.GeoTimeZone }}</mat-label>
      <mat-select
        [value]="value()"
        [disabled]="disabled()"
        [errorStateMatcher]="matcher"
        (selectionChange)="onSelect($event.value)"
        (closed)="onTouched()"
      >
        @for (zone of options(); track zone.name) {
          <mat-option [value]="zone.name" [class.font-medium]="zone.defaultZone">
            {{ withOffset(zone.name) }}
          </mat-option>
        } @empty {
          <mat-option disabled>{{ labels.GeoCountryFirstHint }}</mat-option>
        }
      </mat-select>
      @if (hint()) {
        <mat-hint>{{ hint() }}</mat-hint>
      }
      @if (hasError('required')) {
        <mat-error>{{ errors.required }}</mat-error>
      }
      @if (serverError(); as message) {
        <mat-error>{{ message }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class TimeZoneSelectComponent extends GeoControlBase<string> {
  private readonly geo = inject(GeoService);

  readonly countryCode = input<string | null>(null);
  readonly label = input('');
  readonly hint = input('');

  private readonly zones = toSignal(
    toObservable(this.countryCode).pipe(
      distinctUntilChanged(),
      switchMap((code) =>
        code ? this.geo.countryTimeZones(code).pipe(catchError(() => of([]))) : of([]),
      ),
    ),
    { initialValue: [] as GeoCountryTimeZone[] },
  );

  protected readonly options = computed<GeoCountryTimeZone[]>(() => {
    const zones = this.zones();
    const current = this.value();
    if (!current || zones.some((zone) => zone.name === current)) return zones;
    return [...zones, { name: current, defaultZone: false }];
  });

  protected withOffset(zone: string): string {
    return zoneWithOffset(zone);
  }

  protected onSelect(zone: string): void {
    this.commit(zone);
    this.picked.emit(zone);
  }
}
