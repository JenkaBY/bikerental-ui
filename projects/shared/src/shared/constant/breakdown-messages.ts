import type { RentalCostBreakdown } from '../../core/models';
import { Labels } from './labels';

function line(duration: string, formula: string, total: string): string {
  return $localize`${duration}:duration: · ${formula}:formula: = ${total}:total:`;
}

function lineNoFormula(duration: string, total: string): string {
  return $localize`${duration}:duration: · ${total}:total:`;
}

export function resolveBreakdownMessage(bd: RentalCostBreakdown): string {
  const code = bd.breakdownPatternCode;
  const p = bd.params ?? {};
  const currency = bd.itemCost?.currency ?? 'p.';

  const raw = (key: string): string => {
    const value = p[key];
    return value == null ? '' : String(value);
  };
  const money = (key: string): string => `${raw(key)} ${currency}`.trim();

  const H = Labels.HourShort;
  const M = Labels.MinuteShort;
  const D = Labels.DayShort;

  switch (code) {
    case 'breakdown.cost.zero':
      return $localize`0 ${M}:minutes: · 0 ${currency}:currency:`;
    case 'breakdown.cost.special':
      return $localize`Special tariff`;
    case 'breakdown.cost.special.group':
      return $localize`Special tariff (group)`;

    case 'breakdown.cost.flat_hourly.minimum':
    case 'breakdown.cost.degressive_hourly.minimum':
      return $localize`${raw('durationMinutes')}:duration: ${M}:minLabel: minimum · ${raw('rate')}:rate:/2 + ${raw('surcharge')}:surcharge: = ${money('total')}:total:`;

    case 'breakdown.cost.flat_hourly.standard':
      return line(
        `${raw('hours')} ${H} ${raw('minutes')} ${M}`,
        `${raw('hours')}×${raw('rate')} + …`,
        money('total'),
      );

    case 'breakdown.cost.flat_hourly.minutes_only':
      return lineNoFormula(`${raw('minutes')} ${M}`, money('total'));

    case 'breakdown.cost.daily.standard':
      return lineNoFormula(`${raw('days')} ${D}`, money('total'));

    case 'breakdown.cost.daily.overtime':
      return lineNoFormula(
        `${raw('days')} ${D} + ${raw('hours')} ${H} ${raw('minutes')} ${M}`,
        money('total'),
      );

    case 'breakdown.cost.flat_fee':
      return line($localize`Flat fee`, `${raw('fee')}×${raw('days')} ${D}`, money('total'));

    case 'breakdown.cost.degressive_hourly.standard':
      return line(
        `${raw('hours')} ${H} ${raw('minutes')} ${M}`,
        raw('rateBreakdown'),
        money('total'),
      );

    case 'breakdown.cost.degressive_hourly.minutes_only':
      return line(`${raw('minutes')} ${M}`, raw('rateBreakdown'), money('total'));

    default:
      return bd.calculationMessage || Labels.NotAvailable;
  }
}
