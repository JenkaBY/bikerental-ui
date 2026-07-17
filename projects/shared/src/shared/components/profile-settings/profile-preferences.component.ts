import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Labels } from '../../constant/labels';
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
        <mat-select [value]="language()" (selectionChange)="onLanguageChange($event.value)">
          <mat-option value="en-US">{{ labels.ProfileLanguageEnglish }}</mat-option>
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

  protected readonly labels = Labels;
  protected readonly appVersion = environment.appVersion;
  protected readonly language = computed(() => this.userStore.preferences().language);

  protected onLanguageChange(language: string): void {
    this.userStore.updatePreferences({ language });
  }
}
