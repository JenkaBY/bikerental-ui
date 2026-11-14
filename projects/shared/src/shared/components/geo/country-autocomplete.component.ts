import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { GeoService } from '../../../core/api/geo/geo.service';
import type { GeoCountry } from '../../../core/models/geo.model';
import { GEO_SEARCH_DEBOUNCE_MS, GeoAutocompleteBase } from './geo-autocomplete.base';

export interface GeoCountryPick {
  readonly country: GeoCountry;
  readonly changed: boolean;
}

@Component({
  selector: 'app-country-autocomplete',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatInputModule, MatAutocompleteModule],
  template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ labels.GeoCountry }}</mat-label>
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
      <mat-autocomplete
        #auto="matAutocomplete"
        [displayWith]="displayWith"
        (optionSelected)="onPick($event.option.value)"
      >
        @for (country of options(); track country.code) {
          <mat-option [value]="country">
            {{ country.name }} <span class="text-xs text-slate-500">{{ country.code }}</span>
          </mat-option>
        } @empty {
          <mat-option disabled>{{ labels.GeoNoMatches }}</mat-option>
        }
      </mat-autocomplete>
      @if (hasError('required')) {
        <mat-error>{{ errors.required }}</mat-error>
      }
      @if (serverError(); as message) {
        <mat-error>{{ message }}</mat-error>
      }
    </mat-form-field>
  `,
})
export class CountryAutocompleteComponent extends GeoAutocompleteBase<GeoCountry, GeoCountryPick> {
  private readonly geo = inject(GeoService);
  private confirmedCode: string | null = null;

  protected readonly options = toSignal(
    toObservable(this.text).pipe(
      debounceTime(GEO_SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      switchMap((query) => this.geo.countries(query).pipe(catchError(() => of([])))),
    ),
    { initialValue: [] as GeoCountry[] },
  );

  override writeValue(value: GeoCountry | null): void {
    this.confirmedCode = value?.code ?? null;
    super.writeValue(value);
  }

  protected display(value: GeoCountry | null): string {
    return value?.name ?? '';
  }

  protected valueFromText(): GeoCountry | null {
    return null;
  }

  protected onPick(country: GeoCountry): void {
    const changed = country.code !== this.confirmedCode;
    this.confirmedCode = country.code;
    this.select(country, { country, changed });
  }
}
