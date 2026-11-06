import type {
  SettingChangeKind,
  SettingRule,
  SettingSource,
  SettingValue,
  SettingValueKind,
  SettingViolation,
} from '../core/models/business-setting.model';
import { Labels } from './constant/labels';

type Params = Readonly<Record<string, unknown>>;

export interface SettingSourceMeta {
  label: string;
  badgeClass: string;
}

export const SETTING_SOURCE_META: Record<SettingSource, SettingSourceMeta> = {
  BUSINESS: {
    label: Labels.BusinessSettingSourceBusiness,
    badgeClass: 'bg-indigo-100 text-indigo-700',
  },
  INSTALLATION_DEFAULT: {
    label: Labels.BusinessSettingSourceDefault,
    badgeClass: 'bg-gray-100 text-gray-600',
  },
  POINT: { label: Labels.BusinessSettingSourcePoint, badgeClass: 'bg-amber-100 text-amber-700' },
};

export const SETTING_CHANGE_KIND_LABELS: Record<SettingChangeKind, string> = {
  SET: Labels.SettingHistoryKindSet,
  RESET: Labels.SettingHistoryKindReset,
};

const PATTERN_PART_LABELS: Record<string, string> = {
  DAY: Labels.SettingPatternPartDay,
  MONTH: Labels.SettingPatternPartMonth,
  YEAR: Labels.SettingPatternPartYear,
  HOUR: Labels.SettingPatternPartHour,
  MINUTE: Labels.SettingPatternPartMinute,
  TIME_OF_DAY: Labels.SettingPatternPartTimeOfDay,
};

export function settingUnitSuffix(kind: SettingValueKind, unit: string | null): string {
  if (kind === 'minutes') return Labels.BusinessSettingMinutesUnit;
  if (kind === 'money') return unit ?? '';
  return '';
}

export function formatSettingValue(
  value: SettingValue | null,
  kind: SettingValueKind,
  unit: string | null,
): string {
  if (value === null || value === '') return '—';
  if (kind === 'money' && typeof value === 'number') return `${value.toFixed(2)} ${unit ?? ''}`;
  const suffix = settingUnitSuffix(kind, unit);
  return suffix ? `${value} ${suffix}` : String(value);
}

export function describeSettingRule(rule: SettingRule): string {
  const p = rule.params;
  switch (rule.type) {
    case 'range':
      return describeBounds(p, 'min', 'max', {
        both: Labels.settingRuleRange,
        min: Labels.settingRuleRangeMin,
        max: Labels.settingRuleRangeMax,
      });
    case 'scale':
      return Labels.settingRuleScale(text(p['maxScale']));
    case 'length':
      return describeBounds(p, 'minLength', 'maxLength', {
        both: Labels.settingRuleLength,
        min: Labels.settingRuleLengthMin,
        max: Labels.settingRuleLengthMax,
      });
    case 'single_line':
      return Labels.SettingRuleSingleLine;
    case 'pattern_parts':
      return describePatternParts(p);
    default:
      return Labels.settingRuleUnknown(rule.type);
  }
}

export function describeSettingViolation(violation: SettingViolation): string {
  const r = violation.rule;
  switch (violation.code) {
    case 'type':
      return Labels.SettingViolationType;
    case 'whole_minutes':
      return Labels.SettingViolationWholeMinutes;
    case 'scale':
      return Labels.settingViolationScale(text(r['maxScale']));
    case 'range':
      return Labels.settingViolationRange(describeSettingRule({ type: 'range', params: r }));
    case 'length':
      return Labels.settingViolationLength(describeSettingRule({ type: 'length', params: r }));
    case 'single_line':
      return Labels.SettingViolationSingleLine;
    case 'pattern_malformed':
      return Labels.SettingViolationPatternMalformed;
    case 'pattern_unformattable':
      return Labels.SettingViolationPatternUnformattable;
    case 'pattern_missing_part':
      return Labels.settingViolationPatternMissing(partsList(r['missing']));
    case 'pattern_time_of_day':
      return Labels.SettingViolationPatternTimeOfDay;
    case 'blank':
      return Labels.SettingViolationBlank;
    default:
      return Labels.settingViolationUnknown(violation.code);
  }
}

function describePatternParts(p: Params): string {
  const required = partsList(p['requiredParts']);
  const forbidden = partsList(p['forbiddenParts']);
  return [
    required ? Labels.settingRuleRequiredParts(required) : '',
    forbidden ? Labels.settingRuleForbiddenParts(forbidden) : '',
  ]
    .filter(Boolean)
    .join('; ');
}

function describeBounds(
  p: Params,
  minKey: string,
  maxKey: string,
  labels: {
    both: (min: string, max: string) => string;
    min: (min: string) => string;
    max: (max: string) => string;
  },
): string {
  const min = p[minKey];
  const max = p[maxKey];
  if (isPresent(min) && isPresent(max)) return labels.both(text(min), text(max));
  if (isPresent(min)) return labels.min(text(min));
  if (isPresent(max)) return labels.max(text(max));
  return '';
}

function partsList(raw: unknown): string {
  if (!Array.isArray(raw)) return '';
  return raw.map((part) => PATTERN_PART_LABELS[String(part)] ?? String(part)).join(', ');
}

function isPresent(value: unknown): boolean {
  return value !== null && value !== undefined && value !== '';
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}
