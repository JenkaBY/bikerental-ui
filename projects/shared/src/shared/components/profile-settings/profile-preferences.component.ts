import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  linkedSignal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Labels } from '../../constant/labels';
import { ProfileStore } from '../../../core/state/profile.store';
import { UserStore } from '../../../core/state/user.store';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile-preferences',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatFormFieldModule, MatSelectModule],
  template: `
    <div class="flex flex-col gap-3 p-3 md:p-4 max-w-xl">
      <mat-form-field appearance="outline" class="w-full">
        <mat-label>{{ labels.ProfileLanguageLabel }}</mat-label>
        <mat-select
          [value]="language()"
          [disabled]="saving()"
          (selectionChange)="onLanguageChange($event.value)"
        >
          <mat-option value="en">{{ labels.ProfileLanguageEnglish }}</mat-option>
          <mat-option value="ru">{{ labels.ProfileLanguageRussian }}</mat-option>
        </mat-select>
      </mat-form-field>

      <div class="flex items-center justify-between text-sm opacity-70">
        <span>{{ labels.ProfileAppVersion }}</span>
        <span class="font-mono">{{ appVersion }}</span>
      </div>
    </div>
  `,
})
export class ProfilePreferencesComponent {
  private readonly userStore = inject(UserStore);
  private readonly profileStore = inject(ProfileStore);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly labels = Labels;
  protected readonly appVersion = environment.appVersion;
  protected readonly saving = this.profileStore.savingPreferences;
  protected readonly language = linkedSignal(() => this.userStore.preferences().language);

  protected onLanguageChange(language: string): void {
    if (language === this.userStore.preferences().language) {
      return;
    }
    this.language.set(language);
    this.profileStore
      .savePreferences({ language })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: () => this.language.set(this.userStore.preferences().language),
      });
  }
}
