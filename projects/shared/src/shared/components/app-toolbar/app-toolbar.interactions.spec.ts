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
    fixture.componentInstance.title = (() => 'Test Title') as unknown as InputSignal<string>;
    fixture.detectChanges();

    const spans = fixture.debugElement.queryAll(By.css('mat-toolbar span'));
    const spanDe = spans.find((s) => s.nativeElement.textContent.includes('Test Title'))!;
    expect(spanDe).toBeTruthy();

    spanDe.triggerEventHandler('click', new MouseEvent('click'));
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('keyup.enter on title calls goHome', async () => {
    const navigate = vi.fn();
    const mockRouter: { navigate: (...args: unknown[]) => unknown } = { navigate };

    await TestBed.configureTestingModule({
      imports: [AppToolbarComponent],
      providers: [{ provide: (await import('@angular/router')).Router, useValue: mockRouter }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppToolbarComponent);
    fixture.componentInstance.title = (() => 'Test Title') as unknown as InputSignal<string>;
    fixture.detectChanges();

    const spans = fixture.debugElement.queryAll(By.css('mat-toolbar span'));
    const spanDe = spans.find((s) => s.nativeElement.textContent.includes('Test Title'))!;

    spanDe.triggerEventHandler('keyup.enter', new KeyboardEvent('keyup', { key: 'Enter' }));
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('keyup.space on title calls goHome', async () => {
    const navigate = vi.fn();
    const mockRouter: { navigate: (...args: unknown[]) => unknown } = { navigate };

    await TestBed.configureTestingModule({
      imports: [AppToolbarComponent],
      providers: [{ provide: (await import('@angular/router')).Router, useValue: mockRouter }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppToolbarComponent);
    fixture.componentInstance.title = (() => 'Test Title') as unknown as InputSignal<string>;
    fixture.detectChanges();

    const spans = fixture.debugElement.queryAll(By.css('mat-toolbar span'));
    const spanDe = spans.find((s) => s.nativeElement.textContent.includes('Test Title'))!;

    spanDe.triggerEventHandler('keyup.space', new KeyboardEvent('keyup', { key: ' ' }));
    expect(navigate).toHaveBeenCalledWith(['/']);
  });

  it('keydown.space on title calls preventDefault', async () => {
    const navigate = vi.fn();
    const mockRouter: { navigate: (...args: unknown[]) => unknown } = { navigate };

    await TestBed.configureTestingModule({
      imports: [AppToolbarComponent],
      providers: [{ provide: (await import('@angular/router')).Router, useValue: mockRouter }],
    }).compileComponents();

    const fixture = TestBed.createComponent(AppToolbarComponent);
    fixture.componentInstance.title = (() => 'Test Title') as unknown as InputSignal<string>;
    fixture.detectChanges();

    const spans = fixture.debugElement.queryAll(By.css('mat-toolbar span'));
    const spanDe = spans.find((s) => s.nativeElement.textContent.includes('Test Title'))!;

    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    spanDe.triggerEventHandler('keydown.space', event);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
