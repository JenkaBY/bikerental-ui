import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { map, startWith } from 'rxjs/operators';
import {
  ApiErrorParser,
  applyGeoLocationErrors,
  applyServerErrors,
  clearServerErrors,
  createGeoLocationGroup,
  ErrorCode,
  ErrorMessageResolver,
  FormErrorMessages,
  type GeoLocation,
  GeoLocationFieldsComponent,
  geoLocationFormValue,
  GeoLocationSaveError,
  isSameGeoLocation,
  Labels,
  NotificationService,
  phonePatternValidator,
  type Point,
  PointAdminStore,
  type PointDraft,
  suppressErrorNotification,
  syncGeoLocationEnabled,
  TimeZoneAutocompleteComponent,
  toGeoLocationWrite,
} from '@bikerental/shared';

export type PointProfileFormMode = 'create' | 'edit';

@Component({
  selector: 'app-point-profile-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    GeoLocationFieldsComponent,
    TimeZoneAutocompleteComponent,
  ],
  templateUrl: './point-profile-form.component.html',
})
export class PointProfileFormComponent {
  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;
  protected readonly contactFields = [
    { key: 'primaryPhone', label: Labels.PointPrimaryPhone, type: 'tel' },
    { key: 'additionalPhone', label: Labels.PointAdditionalPhone, type: 'tel' },
    { key: 'email', label: Labels.Email, type: 'email' },
  ] as const;

  readonly mode = input<PointProfileFormMode>('edit');
  readonly point = input<Point | null>(null);

  readonly saved = output<Point>();
  readonly cancelled = output<void>();

  private readonly store = inject(PointAdminStore);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly creating = computed(() => this.mode() === 'create');
  protected readonly editing = computed(() => this.creating() || this.store.editing());
  protected readonly saving = this.store.saving;
  protected readonly closed = computed(() => this.point()?.status === 'PERMANENTLY_CLOSED');
  private readonly location = computed<GeoLocation | null>(() => {
    const id = this.point()?.geoLocationId;
    return id ? (this.store.locations().get(id) ?? null) : null;
  });
  protected readonly incomplete = computed(() => {
    const p = this.point();
    return !this.creating() && !!p && (!p.geoLocationId || !p.timeZone);
  });

  protected readonly form = new FormGroup({
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    location: createGeoLocationGroup(),
    timeZone: new FormControl<string | null>(null, { validators: [Validators.required] }),
    contacts: new FormGroup({
      primaryPhone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, phonePatternValidator()],
      }),
      additionalPhone: new FormControl('', {
        nonNullable: true,
        validators: [phonePatternValidator()],
      }),
      email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    }),
  });

  protected readonly countryCode = toSignal(
    this.form.controls.location.controls.country.valueChanges.pipe(
      startWith(this.form.controls.location.controls.country.value),
      map((country) => country?.code ?? null),
    ),
    { initialValue: null },
  );

  constructor() {
    effect(() => this.resetForm(this.point(), this.location(), this.creating(), this.editing()));
  }

  protected onCountryChanged(): void {
    this.form.controls.timeZone.enable();
  }

  protected onZoneSuggested(zone: string | null): void {
    this.form.controls.timeZone.setValue(zone);
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) return;
    clearServerErrors(this.form);
    const draft = this.toDraft();
    if (!draft) return;
    const options = { context: suppressErrorNotification() };
    const current = this.point();
    const request$ =
      this.creating() || !current
        ? this.store.create(draft, options)
        : this.store.update(current.slug, draft, options);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (point) => {
        this.notifications.success(Labels.PointSaved);
        this.saved.emit(point);
      },
      error: (err) => this.handleSaveError(err),
    });
  }

  protected edit(): void {
    this.store.startEdit();
  }

  protected cancel(): void {
    if (this.creating()) {
      this.cancelled.emit();
      return;
    }
    this.store.cancelEdit();
  }

  private toDraft(): PointDraft | null {
    const { slug, name, timeZone, contacts } = this.form.getRawValue();
    const write = toGeoLocationWrite(this.form.controls.location);
    if (!write || !timeZone) return null;
    const currentId = this.point()?.geoLocationId;
    const reuse = !this.creating() && !!currentId && isSameGeoLocation(write, this.location());
    return { slug, name, timeZone, contacts, location: reuse && currentId ? currentId : write };
  }

  private handleSaveError(err: unknown): void {
    if (err instanceof GeoLocationSaveError) {
      const summary = applyGeoLocationErrors(this.form.controls.location, err.cause);
      if (summary.length) this.notifications.error(summary.join(' '));
      return;
    }
    const apiError = ApiErrorParser.parse(err);
    const message = this.resolver.resolve(apiError);
    if (apiError.code === ErrorCode.POINT_SLUG_DUPLICATE) {
      this.form.controls.slug.setErrors({ server: message });
      this.form.controls.slug.markAsTouched();
      return;
    }
    const summary = applyServerErrors(this.form, apiError);
    if (summary.length) {
      this.notifications.error(summary.join(' '));
    } else if (apiError.fieldErrors.length === 0) {
      this.notifications.error(message);
    }
  }

  private resetForm(
    point: Point | null,
    location: GeoLocation | null,
    creating: boolean,
    editing: boolean,
  ): void {
    this.form.reset({
      slug: point?.slug ?? '',
      name: point?.name ?? '',
      location: geoLocationFormValue(location),
      timeZone: point?.timeZone ?? null,
      contacts: {
        primaryPhone: point?.contacts.primaryPhone ?? '',
        additionalPhone: point?.contacts.additionalPhone ?? '',
        email: point?.contacts.email ?? '',
      },
    });
    if (!creating && !editing) {
      this.form.disable();
      return;
    }
    this.form.enable();
    if (!creating) this.form.controls.slug.disable();
    syncGeoLocationEnabled(this.form.controls.location, [this.form.controls.timeZone]);
  }
}
