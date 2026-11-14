import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { of } from 'rxjs';
import { catchError, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { GeoService } from '../../../core/api/geo/geo.service';
import type { GeoTimeZone } from '../../../core/models/geo.model';
import { zoneWithOffset } from '../../business-setting.meta';
import { GeoAutocompleteBase } from './geo-autocomplete.base';

const MAX_OPTIONS = 100;

@Component({
  selector: 'app-time-zone-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ labels.GeoTimeZone }}</mat-label>
      <input
        matInput
        autocomplete="off"
        [value]="text()"
        [disabled]="disabled()"
        [errorStateMatcher]="matcher"
        [matAutocomplete]="auto"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onPick($event.option.value)">
        @for (zone of options(); track zone.name) {
          <mat-option [value]="zone.name" [class.font-medium]="zone.ofCountry">
            {{ withOffset(zone.name) }}
          </mat-option>
        } @empty {
          <mat-option disabled>{{ labels.GeoNoMatches }}</mat-option>
        }
      </mat-autocomplete>
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
export class TimeZoneAutocompleteComponent extends GeoAutocompleteBase<string> {
  private readonly geo = inject(GeoService);

  readonly countryCode = input<string | null>(null);
  readonly hint = input('');

  private readonly zones = toSignal(
    toObservable(this.countryCode).pipe(
      distinctUntilChanged(),
      switchMap((code) => this.geo.timeZones(code ?? undefined).pipe(catchError(() => of([])))),
    ),
    { initialValue: [] as GeoTimeZone[] },
  );

  protected readonly options = computed(() => {
    const query = normalize(this.text());
    const selected = this.value();
    const all = this.zones();
    const matching =
      !query || query === normalize(selected ?? '')
        ? all
        : all.filter((zone) => normalize(zone.name).includes(query));
    return matching.slice(0, MAX_OPTIONS);
  });

  protected withOffset(zone: string): string {
    return zoneWithOffset(zone);
  }

  protected display(value: string | null): string {
    return value ?? '';
  }

  protected valueFromText(text: string): string | null {
    const wanted = text.trim().toLowerCase();
    return this.zones().find((zone) => zone.name.toLowerCase() === wanted)?.name ?? null;
  }

  protected onPick(zone: string): void {
    this.select(zone, zone);
  }
}

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, ' ');
}
