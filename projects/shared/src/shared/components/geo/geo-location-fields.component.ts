import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { distinctUntilChanged, map, startWith, switchMap } from 'rxjs/operators';
import type { GeoCity, GeoCountry } from '../../../core/models/geo.model';
import { Labels } from '../../constant/labels';
import { FormErrorMessages } from '../../validators/form-error-messages';
import { CityAutocompleteComponent } from './city-autocomplete.component';
import {
  CountryAutocompleteComponent,
  type GeoCountryPick,
} from './country-autocomplete.component';
import type { GeoLocationFormGroup } from './geo-location.form';

@Component({
  selector: 'app-geo-location-fields',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    CountryAutocompleteComponent,
    CityAutocompleteComponent,
  ],
  template: `
    <div [formGroup]="group()" class="grid grid-cols-3 gap-x-4">
      <app-country-autocomplete formControlName="country" (picked)="onCountryPicked($event)" />
      <app-city-autocomplete
        formControlName="city"
        [countryCode]="countryCode()"
        (picked)="onCityPicked($event)"
      />
      <mat-form-field appearance="outline">
        <mat-label>{{ labels.GeoStreet }}</mat-label>
        <input matInput formControlName="street" />
        @if (group().controls.street.hasError('maxlength')) {
          <mat-error>{{ errors.streetMaxLength }}</mat-error>
        }
        @if (group().controls.street.hasError('server')) {
          <mat-error>{{ group().controls.street.getError('server') }}</mat-error>
        }
      </mat-form-field>
    </div>
  `,
})
export class GeoLocationFieldsComponent {
  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;

  readonly group = input.required<GeoLocationFormGroup>();

  readonly countryChanged = output<GeoCountry>();
  readonly zoneSuggested = output<string | null>();

  protected readonly countryCode = toSignal(
    toObservable(this.group).pipe(
      switchMap((group) =>
        group.controls.country.valueChanges.pipe(startWith(group.controls.country.value)),
      ),
      map((country) => country?.code ?? null),
      distinctUntilChanged(),
    ),
    { initialValue: null },
  );

  protected onCountryPicked({ country, changed }: GeoCountryPick): void {
    const { city, street } = this.group().controls;
    if (changed) city.reset(null);
    city.enable();
    street.enable();
    this.countryChanged.emit(country);
    this.zoneSuggested.emit(country.defaultTimeZone);
  }

  protected onCityPicked(city: GeoCity): void {
    const country = this.group().controls.country.value;
    this.zoneSuggested.emit(city.suggestedTimeZone ?? country?.defaultTimeZone ?? null);
  }
}
