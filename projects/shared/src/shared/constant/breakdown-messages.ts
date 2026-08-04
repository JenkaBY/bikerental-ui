import type { RentalCostBreakdown } from '../../core/models';
import { Labels } from './labels';

function line(duration: string, formula: string, total: string): string {
  return $localize`${duration}:duration: · ${formula}:formula: = ${total}:total:`;
}

function lineNoFormula(duration: string, total: string): string {
  return $localize`${duration}:duration: · ${total}:total:`;
}

export function resolveTariffCodeLabel(bd: RentalCostBreakdown): string {
  const source = bd.tariffCode || bd.pricingType;
  if (!source) {
    return '';
  }
  const slug = source.trim().toUpperCase().replace(/\s+/g, '_');
  return Labels.PricingTypeTitles[slug] ?? '';
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
  const formulaLine = (duration: string): string => {
    const formula = raw('rateBreakdown');
    return formula
      ? line(duration, formula, money('total'))
      : lineNoFormula(duration, money('total'));
  };

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

    case 'breakdown.cost.early_return_free':
      return $localize`${raw('actualMinutes')}:actual: ${M}:minLabel: · free within ${raw('withinMinutes')}:within: ${M}:minLabel2: = ${money('total')}:total:`;

    case 'breakdown.cost.flat_hourly.minimum':
    case 'breakdown.cost.degressive_hourly.minimum':
      return $localize`${raw('durationMinutes')}:duration: ${M}:minLabel: minimum · ${raw('rate')}:rate:/2 + ${raw('surcharge')}:surcharge: = ${money('total')}:total:`;

    case 'breakdown.cost.flat_hourly.standard':
    case 'breakdown.cost.degressive_hourly.standard':
      return formulaLine(`${raw('hours')} ${H} ${raw('minutes')} ${M}`);

    case 'breakdown.cost.flat_hourly.minutes_only':
    case 'breakdown.cost.degressive_hourly.minutes_only':
      return formulaLine(`${raw('minutes')} ${M}`);

    case 'breakdown.cost.daily.standard':
      return formulaLine(`${raw('days')} ${D}`);

    case 'breakdown.cost.daily.overtime':
      return formulaLine(`${raw('days')} ${D} ${raw('hours')} ${H} ${raw('minutes')} ${M}`);

    case 'breakdown.cost.flat_fee':
      return line($localize`Flat fee`, `${raw('fee')}×${raw('days')} ${D}`, money('total'));

    default:
      return bd.calculationMessage || Labels.NotAvailable;
  }
}
