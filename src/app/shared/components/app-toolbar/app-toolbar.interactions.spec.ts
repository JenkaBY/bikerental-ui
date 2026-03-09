import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AppToolbarComponent } from './app-toolbar.component';
import type { InputSignal } from '@angular/core';

describe('AppToolbarComponent interactions', () => {
  it('title click and keyboard events call goHome -> router.navigate', async () => {
    const navigate = vi.fn();
    const mockRouter: { navigate: (...args: unknown[]) => unknown } = { navigate };

    await TestBed.configureTestingModule({
      imports: [AppToolbarComponent],
      providers: [{ provide: (await import('@angular/router')).Router, useValue: mockRouter }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppToolbarComponent);
    // set required input; the component uses input() signal, so assign a function that returns the title
    fixture.componentInstance.title = (() => 'Test Title') as unknown as InputSignal<string>;
    fixture.detectChanges();

    const spans = fixture.debugElement.queryAll(By.css('mat-toolbar span'));
    const spanDe = spans.find((s) => s.nativeElement.textContent.includes('Test Title'))!;
    expect(spanDe).toBeTruthy();

    // Trigger Angular event handlers with proper event objects
    spanDe.triggerEventHandler('click', new MouseEvent('click'));
    spanDe.triggerEventHandler('keyup', { key: 'Enter' });
    spanDe.triggerEventHandler('keyup', { key: ' ' });
    spanDe.triggerEventHandler('keydown', new KeyboardEvent('keydown', { key: ' ' }));

    expect(navigate).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith(['/']);
  });
});
