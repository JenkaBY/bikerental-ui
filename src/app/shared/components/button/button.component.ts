import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable button component used across the app.
 * - Inputs: title, ariaLabel, icon, showText, disabled
 * - Output: activated
 *
 * Behavior:
 * - If `showText` is true -> renders a `mat-button` with optional icon + text
 * - If `showText` is false -> renders a compact `mat-icon-button` (icon required)
 */
@Component({
  selector: 'app-button',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (showText()) {
      <button
        mat-button
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel()"
        [title]="title()"
        (click)="activated.emit()"
        class="flex items-center gap-2"
      >
        @if (icon()) {
          <mat-icon>{{ icon() }}</mat-icon>
        } @else {
          <!-- no icon when showText and icon not provided -->
        }
        <span>{{ title() }}</span>
      </button>
    } @else {
      <button
        mat-icon-button
        [disabled]="disabled()"
        [attr.aria-label]="ariaLabel()"
        [title]="title()"
        (click)="activated.emit()"
      >
        @if (icon()) {
          <mat-icon>{{ icon() }}</mat-icon>
        } @else {
          <mat-icon>help</mat-icon>
        }
      </button>
    }
  `,
})
export class ButtonComponent {
  title = input<string>('');
  ariaLabel = input<string>('');
  icon = input<string | undefined>(undefined);
  showText = input<boolean>(false);
  disabled = input<boolean>(false);

  activated = output<void>();
}
