import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-toggle-button',
  standalone: true,
  imports: [ButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-button
      [title]="title()"
      [ariaLabel]="ariaLabel()"
      [icon]="icon()"
      [showText]="showText()"
      (activated)="toggled.emit()"
    ></app-button>
  `,
})
export class ToggleButtonComponent {
  title = input<string>($localize`Toggle sidebar`);

  ariaLabel = input<string>($localize`Toggle sidebar`);

  showText = input<boolean>(false);

  customIcon = input<string | undefined>(undefined);

  pressed = input<boolean>(false);

  icon = computed(() =>
    this.customIcon() ? this.customIcon() : this.pressed() ? 'menu_open' : 'menu',
  );

  toggled = output<void>();
}
