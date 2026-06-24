import { afterNextRender, ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Labels } from '../../shared/constant/labels';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-login-callback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
  host: { class: 'flex h-full items-center justify-center p-8' },
  template: `
    <div class="flex flex-col items-center gap-4">
      <mat-spinner diameter="40" />
      <p class="text-sm text-slate-500">{{ labels.SigningIn }}</p>
    </div>
  `,
})
export class LoginCallbackComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly labels = Labels;

  constructor() {
    afterNextRender(() => {
      if (this.auth.isAuthenticated()) {
        void this.router.navigateByUrl(this.auth.mustChangePassword() ? '/change-password' : '/');
      } else {
        this.auth.login();
      }
    });
  }
}
