import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HealthTooltipLineComponent } from './health-tooltip-line.component';

describe('HealthTooltipLineComponent', () => {
  let fixture: ComponentFixture<HealthTooltipLineComponent>;

  async function setup(label: string, value: string | null | undefined) {
    await TestBed.configureTestingModule({
      imports: [HealthTooltipLineComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HealthTooltipLineComponent);
    fixture.componentRef.setInput('label', label);
    fixture.componentRef.setInput('value', value);
    fixture.detectChanges();
  }

  it('should render label and value when value is a non-empty string', async () => {
    await setup('Статус', 'UP');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Статус');
    expect(el.textContent).toContain('UP');
  });

  it('should render nothing when value is null', async () => {
    await setup('Версия', null);
    const div = fixture.nativeElement.querySelector('div');
    expect(div).toBeNull();
  });

  it('should render nothing when value is undefined', async () => {
    await setup('Коммит', undefined);
    const div = fixture.nativeElement.querySelector('div');
    expect(div).toBeNull();
  });

  it('should render when value is an empty string', async () => {
    await setup('Ошибка', '');
    const div = fixture.nativeElement.querySelector('div');
    expect(div).not.toBeNull();
  });

  it('should apply muted style to label span', async () => {
    await setup('Приложение', 'Bike Rental API');
    const label: HTMLElement = fixture.nativeElement.querySelector('span:first-child');
    expect(label.classList).toContain('text-white/60');
  });

  it('should apply bold style to value span', async () => {
    await setup('Приложение', 'Bike Rental API');
    const value: HTMLElement = fixture.nativeElement.querySelector('span:last-child');
    expect(value.classList).toContain('font-medium');
  });
});
