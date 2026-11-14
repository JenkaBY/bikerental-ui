import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { GeoService } from '../../../core/api/geo/geo.service';
import type { GeoCity, GeoCityChoice } from '../../../core/models/geo.model';
import { cityWithRegion } from '../../utils/geo-location.util';
import { GEO_SEARCH_DEBOUNCE_MS, GeoAutocompleteBase } from './geo-autocomplete.base';

@Component({
  selector: 'app-city-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  template: `
    <mat-form-field appearance="outline" class="w-full" subscriptSizing="dynamic">
      <mat-label>{{ labels.GeoCity }}</mat-label>
      <input
        matInput
        autocomplete="off"
        [value]="text()"
        [disabled]="disabled()"
        [errorStateMatcher]="matcher"
        [matAutocomplete]="auto"
        (input)="onInput($event)"
        (blur)="onBlur()"
      />
      <mat-autocomplete #auto="matAutocomplete" (optionSelected)="onPick($event.option.value)">
        @for (city of options(); track city.id) {
          <mat-option [value]="city">
            {{ city.name }}
            @if (city.region) {
              <span class="text-xs text-slate-500">{{ city.region }}</span>
            }
          </mat-option>
        }
      </mat-autocomplete>
      @if (!countryCode()) {
        <mat-hint>{{ labels.GeoCountryFirstHint }}</mat-hint>
      } @else if (isNewCity()) {
        <mat-hint>{{ labels.GeoCityNewHint }}</mat-hint>
      }
      @if (hasError('required')) {
        <mat-error>{{ errors.required }}</mat-error>
      }
      @if (hasError('cityName')) {
        <mat-error>{{ errors.geoCityNameInvalid }}</mat-error>
      }
      @if (serverError(); as message) {
        <mat-error>{{ message }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class CityAutocompleteComponent extends GeoAutocompleteBase<GeoCityChoice, GeoCity> {
  private readonly geo = inject(GeoService);

  readonly countryCode = input<string | null>(null);

  private readonly search = computed(() => ({ code: this.countryCode(), query: this.text() }));

  protected readonly options = toSignal(
    toObservable(this.search).pipe(
      debounceTime(GEO_SEARCH_DEBOUNCE_MS),
      distinctUntilChanged((a, b) => a.code === b.code && a.query === b.query),
      switchMap(({ code, query }) =>
        code ? this.geo.cities(code, query).pipe(catchError(() => of([]))) : of([]),
      ),
    ),
    { initialValue: [] as GeoCity[] },
  );

  protected readonly isNewCity = computed(() => typeof this.value() === 'string');

  protected display(value: GeoCityChoice | null): string {
    if (value === null) return '';
    return typeof value === 'string' ? value : cityWithRegion(value.name, value.region);
  }

  protected valueFromText(text: string): GeoCityChoice | null {
    const name = text.trim();
    return name ? name : null;
  }

  protected onPick(city: GeoCity): void {
    this.select(city, city);
  }

  protected onBlur(): void {
    this.onTouched();
    const value = this.value();
    if (typeof value !== 'string') return;
    const wanted = value.toLocaleLowerCase();
    const matches = this.options().filter((c) => c.name.toLocaleLowerCase() === wanted);
    if (matches.length === 1) this.onPick(matches[0]);
  }
}
