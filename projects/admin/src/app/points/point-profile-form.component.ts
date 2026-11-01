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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  ApiErrorParser,
  applyServerErrors,
  clearServerErrors,
  ErrorCode,
  ErrorMessageResolver,
  FormErrorMessages,
  Labels,
  NotificationService,
  phonePatternValidator,
  type Point,
  PointAdminStore,
  type PointWrite,
  suppressErrorNotification,
} from '@bikerental/shared';

export type PointProfileFormMode = 'create' | 'edit';

@Component({
  selector: 'app-point-profile-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './point-profile-form.component.html',
})
export class PointProfileFormComponent {
  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;
  protected readonly addressFields = [
    { key: 'street', label: Labels.PointStreet },
    { key: 'city', label: Labels.PointCity },
    { key: 'country', label: Labels.PointCountry },
  ] as const;
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

  protected readonly form = new FormGroup({
    slug: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    address: new FormGroup({
      street: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      city: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      country: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    }),
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

  constructor() {
    effect(() => this.resetForm(this.point(), this.creating(), this.editing()));
  }

  protected save(): void {
    if (this.form.invalid || this.saving()) return;
    clearServerErrors(this.form);
    const write: PointWrite = this.form.getRawValue();
    const options = { context: suppressErrorNotification() };
    const current = this.point();
    const request$ =
      this.creating() || !current
        ? this.store.create(write, options)
        : this.store.update(current.slug, write, options);
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

  private handleSaveError(err: unknown): void {
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

  private resetForm(point: Point | null, creating: boolean, editing: boolean): void {
    this.form.reset({
      slug: point?.slug ?? '',
      name: point?.name ?? '',
      address: point?.address ?? { street: '', city: '', country: '' },
      contacts: {
        primaryPhone: point?.contacts.primaryPhone ?? '',
        additionalPhone: point?.contacts.additionalPhone ?? '',
        email: point?.contacts.email ?? '',
      },
    });
    if (creating) {
      this.form.enable();
    } else if (!editing) {
      this.form.disable();
    } else {
      this.form.enable();
      this.form.controls.slug.disable();
    }
  }
}
