import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-button
      [title]="title()"
      [ariaLabel]="ariaLabel()"
      [icon]="icon()"
      [showText]="showText()"
      (activated)="logout.emit()"
    ></app-button>
  `,
})
export class LogoutButtonComponent {
  title = input<string>($localize`Logout`);

  ariaLabel = input<string>($localize`Logout`);

  showText = input<boolean>(false);

  icon = input<string>('logout');

  logout = output<void>();
}
