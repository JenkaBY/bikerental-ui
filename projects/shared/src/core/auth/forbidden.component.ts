import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Labels } from '../../shared/constant/labels';

@Component({
  selector: 'app-forbidden',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  host: { class: 'flex h-full items-center justify-center p-8' },
  template: `
    <div class="flex flex-col items-center gap-4 text-center">
      <mat-icon class="text-red-500" style="font-size: 48px; height: 48px; width: 48px"
        >block</mat-icon
      >
      <h1 class="text-2xl font-semibold text-slate-800">{{ labels.AccessDeniedTitle }}</h1>
      <p class="text-sm text-slate-500">{{ labels.AccessDeniedDetail }}</p>
      <a mat-stroked-button routerLink="/">{{ labels.BackToHome }}</a>
    </div>
  `,
})
export class ForbiddenComponent {
  protected readonly labels = Labels;
}
