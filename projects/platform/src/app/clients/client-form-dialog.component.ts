import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map, startWith } from 'rxjs/operators';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApiErrorParser,
  applyGeoLocationErrors,
  CancelButtonComponent,
  clearServerErrors,
  ClientRegistryStore,
  FormErrorMessages,
  GeoLocationFieldsComponent,
  geoLocationFormValue,
  GeoLocationLookupStore,
  GeoLocationSaveError,
  isSameGeoLocation,
  Labels,
  NotificationService,
  suppressErrorNotification,
  syncGeoLocationEnabled,
  TimeZoneSelectComponent,
  toGeoLocationWrite,
} from '@bikerental/shared';
import type { Client, ClientLocationChoice } from '@bikerental/shared';
import {
  applyClientErrors,
  createClientForm,
  isStaleClientVersion,
  patchClientForm,
  toClientSlug,
} from './client-form';

export interface ClientFormDialogData {
  client?: Client;
}

@Component({
  selector: 'app-client-form-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    CancelButtonComponent,
    GeoLocationFieldsComponent,
    TimeZoneSelectComponent,
  ],
  templateUrl: './client-form-dialog.component.html',
})
export class ClientFormDialogComponent {
  protected readonly Labels = Labels;
  protected readonly errors = FormErrorMessages;
  protected readonly store = inject(ClientRegistryStore);
  protected readonly client = signal<Client | null>(
    inject<ClientFormDialogData>(MAT_DIALOG_DATA).client ?? null,
  );
  protected readonly isEdit = !!this.client();
  protected readonly form = createClientForm(!this.isEdit);
  protected readonly stale = signal(false);

  private readonly lookup = inject(GeoLocationLookupStore);
  private readonly dialogRef =
    inject<MatDialogRef<ClientFormDialogComponent, Client>>(MatDialogRef);
  private readonly notifications = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly countryCode = toSignal(
    this.form.controls.location.controls.country.valueChanges.pipe(
      startWith(this.form.controls.location.controls.country.value),
      map((country) => country?.code ?? null),
    ),
    { initialValue: null },
  );

  constructor() {
    this.fill();
  }

  protected onCountryChanged(): void {
    if (!this.isEdit) this.form.controls.timeZone.enable();
  }

  protected onZoneSuggested(zone: string | null): void {
    if (!this.isEdit) this.form.controls.timeZone.setValue(zone);
  }

  protected save(): void {
    if (this.form.invalid || this.store.saving() || this.stale()) return;
    const location = this.locationChoice();
    if (!location) return;
    clearServerErrors(this.form);
    const raw = this.form.getRawValue();
    const details = {
      displayName: raw.displayName,
      legalName: raw.legalName,
      registrationNumber: raw.registrationNumber,
      contactEmail: raw.contactEmail,
      contactPhone: raw.contactPhone,
    };
    const client = this.client();
    const request$ = client
      ? this.store.update(client, details, location)
      : this.store.register(
          {
            ...details,
            slug: toClientSlug(raw.displayName),
            currency: raw.currency,
            timeZone: raw.timeZone ?? '',
          },
          location,
        );
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.notifications.success(
          client ? Labels.ClientUpdatedSuccess : Labels.ClientRegisteredSuccess,
        );
        this.dialogRef.close(saved);
      },
      error: (err: unknown) => this.handleError(err),
    });
  }

  protected reload(): void {
    const client = this.client();
    if (!client) return;
    this.store
      .loadClient(client.slug, { context: suppressErrorNotification() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fresh) => {
          this.lookup.ensure([fresh.businessGeoLocationId]);
          this.client.set(fresh);
          this.stale.set(false);
          this.fill();
        },
        error: (err: unknown) => this.handleError(err),
      });
  }

  private fill(): void {
    const client = this.client();
    if (client) patchClientForm(this.form, client);
    const current = client ? (this.lookup.byId().get(client.businessGeoLocationId) ?? null) : null;
    this.form.controls.location.reset(geoLocationFormValue(current));
    syncGeoLocationEnabled(
      this.form.controls.location,
      this.isEdit ? [] : [this.form.controls.timeZone],
    );
  }

  private locationChoice(): ClientLocationChoice | null {
    const write = toGeoLocationWrite(this.form.controls.location);
    if (!write) return null;
    const client = this.client();
    const current = client ? (this.lookup.byId().get(client.businessGeoLocationId) ?? null) : null;
    return {
      write,
      unchangedId:
        client && isSameGeoLocation(write, current) ? client.businessGeoLocationId : null,
    };
  }

  private handleError(err: unknown): void {
    if (err instanceof GeoLocationSaveError) {
      const summary = applyGeoLocationErrors(this.form.controls.location, err.cause);
      if (summary.length) this.notifications.error(summary.join(' '));
      return;
    }
    const apiError = ApiErrorParser.parse(err);
    if (isStaleClientVersion(apiError)) {
      this.stale.set(true);
      return;
    }
    const summary = applyClientErrors(this.form, apiError);
    if (summary.length) this.notifications.error(summary.join(' '));
  }
}
