import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LOCALE_ID } from '@angular/core';
import { HealthTooltipComponent, TooltipLine } from './health-tooltip.component';

describe('HealthTooltipComponent', () => {
  let fixture: ComponentFixture<HealthTooltipComponent>;

  async function setup(lines: TooltipLine[]) {
    await TestBed.configureTestingModule({
      imports: [HealthTooltipComponent],
      providers: [{ provide: LOCALE_ID, useValue: 'ru-RU' }],
    }).compileComponents();
    fixture = TestBed.createComponent(HealthTooltipComponent);
    fixture.componentRef.setInput('lines', lines);
    fixture.detectChanges();
  }

  it.each<[string, TooltipLine[], string]>([
    ['renders status value', [{ id: 'status', label: 'Статус', value: 'DOWN' }], 'DOWN'],
    [
      'renders version',
      [{ id: 'version', label: 'Версия', value: 'commit: abc123' }],
      'commit: abc123',
    ],
    [
      'renders app name',
      [{ id: 'name', label: 'Приложение', value: 'Bike Rental API' }],
      'Bike Rental API',
    ],
  ])('%s', async (_, lines, expected) => {
    await setup(lines);
    expect(fixture.nativeElement.textContent).toContain(expected);
  });

  it('does not render line when value is null', async () => {
    await setup([{ id: 'version', label: 'Версия', value: null }]);
    expect(fixture.nativeElement.textContent).not.toContain('Версия');
  });

  it('renders separator and component lines when separator flag is set', async () => {
    await setup([
      { id: 'status', label: 'Статус', value: 'DOWN' },
      { id: 'components-header', label: 'Компоненты', value: '', separator: true },
      { id: 'component-db', label: 'db', value: 'DOWN' },
      { id: 'component-diskSpace', label: 'diskSpace', value: 'UP' },
    ]);
    expect(fixture.nativeElement.querySelector('div.border-t')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('db');
    expect(fixture.nativeElement.textContent).toContain('diskSpace');
  });

  it('does not render separator when separator flag is absent', async () => {
    await setup([{ id: 'status', label: 'Статус', value: 'UP' }]);
    expect(fixture.nativeElement.querySelector('div.border-t')).toBeNull();
  });
});
