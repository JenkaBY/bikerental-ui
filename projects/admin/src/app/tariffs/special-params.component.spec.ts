import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { SpecialParamsComponent } from './special-params.component';
import { Labels } from '@bikerental/shared';

describe('SpecialParamsComponent', () => {
  let fixture: ComponentFixture<SpecialParamsComponent>;
  let component: SpecialParamsComponent;

  async function createComponent(description?: string) {
    await TestBed.configureTestingModule({
      imports: [SpecialParamsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpecialParamsComponent);
    if (description !== undefined) {
      fixture.componentRef.setInput('description', description);
    }
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('creates', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  it('always renders the no-additional-params label', async () => {
    await createComponent();
    expect(fixture.nativeElement.textContent).toContain(Labels.NoAdditionalParams);
  });

  it('shows description when provided', async () => {
    await createComponent('special description');
    const descEl = fixture.nativeElement.querySelector('.text-sm');
    expect(descEl).toBeTruthy();
    expect(descEl.textContent).toContain('special description');
  });

  it('does not render description div when description is empty', async () => {
    await createComponent('');
    const allSmall = Array.from(fixture.nativeElement.querySelectorAll('.text-sm')) as Element[];
    const hasDescription = allSmall.some((e) =>
      Boolean(e.textContent && e.textContent.trim() === ''),
    );
    expect(hasDescription).toBe(false);
  });
});
