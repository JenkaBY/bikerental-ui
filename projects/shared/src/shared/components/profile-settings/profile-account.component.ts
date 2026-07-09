import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Labels } from '../../constant/labels';
import { FormErrorMessages } from '../../validators/form-error-messages';
import { UserStore } from '../../../core/state/user.store';
import { ProfileStore } from '../../../core/state/profile.store';
import { UserAvatarComponent } from '../user-avatar/user-avatar.component';

@Component({
  selector: 'app-profile-account',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    UserAvatarComponent,
  ],
  template: `
    <div class="flex flex-col gap-4 p-3 md:p-4 max-w-xl">
      <div class="flex items-center gap-4">
        <div class="relative shrink-0">
          <app-user-avatar [displayName]="displayName()" sizeClass="h-16 w-16 text-xl" />
          <button
            mat-mini-fab
            type="button"
            disabled
            class="!absolute -bottom-1 -right-1 !h-6 !w-6 !min-h-0 !p-0 !flex !items-center !justify-center"
            [attr.aria-label]="labels.ProfileUploadPhoto"
          >
            <mat-icon class="!text-base">photo_camera</mat-icon>
          </button>
        </div>
        <div class="flex flex-col gap-1 min-w-0">
          <span class="font-medium text-slate-800 truncate">{{ username() }}</span>
          <div class="flex flex-wrap gap-1">
            @for (role of roles(); track role) {
              <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                {{ role }}
              </span>
            } @empty {
              <span class="text-xs text-slate-400">—</span>
            }
          </div>
        </div>
      </div>

      <form [formGroup]="form" class="flex flex-col gap-3" (ngSubmit)="save()">
        <mat-form-field appearance="outline">
          <mat-label>{{ labels.UserEmailLabel }}</mat-label>
          <input matInput type="email" formControlName="email" autocomplete="email" />
          @if (form.controls.email.hasError('email')) {
            <mat-error>{{ errors.emailInvalid }}</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>{{ labels.UserDisplayNameLabel }}</mat-label>
          <input matInput formControlName="displayName" />
          @if (form.controls.displayName.hasError('required')) {
            <mat-error>{{ errors.required }}</mat-error>
          }
        </mat-form-field>

        <div class="flex justify-end pt-1">
          <button
            mat-flat-button
            color="primary"
            type="submit"
            [disabled]="form.invalid || form.pristine"
          >
            {{ labels.Save }}
          </button>
        </div>
      </form>
    </div>
  `,
})
export class ProfileAccountComponent {
  private readonly userStore = inject(UserStore);
  private readonly profileStore = inject(ProfileStore);

  protected readonly labels = Labels;
  protected readonly errors = FormErrorMessages;

  protected readonly username = computed(() => this.userStore.currentUser()?.username ?? '');
  protected readonly displayName = computed(() => this.userStore.currentUser()?.displayName ?? '');
  protected readonly roles = computed(() => this.userStore.currentUser()?.roles ?? []);

  protected readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    displayName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    const user = this.userStore.currentUser();
    if (user) {
      this.form.patchValue(
        { email: user.email, displayName: user.displayName },
        { emitEvent: false },
      );
    }
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { email, displayName } = this.form.getRawValue();
    this.profileStore.saveProfile({ email, displayName });
    this.form.markAsPristine();
  }
}
