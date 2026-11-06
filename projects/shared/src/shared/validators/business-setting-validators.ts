import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import type {
  SettingRule,
  SettingValue,
  SettingValueKind,
  SettingViolation,
} from '../../core/models/business-setting.model';

export const SETTING_VIOLATIONS_KEY = 'settingViolations';

export function parseSettingInput(raw: string, kind: SettingValueKind): SettingValue | null {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (kind === 'minutes' || kind === 'money') {
    const value = Number(trimmed.replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }
  return raw;
}

export function businessSettingValueValidator(
  kind: SettingValueKind,
  rules: readonly SettingRule[],
): ValidatorFn {
  return (control: AbstractControl<string>): ValidationErrors | null => {
    const raw = control.value ?? '';
    if (raw.trim() === '') return { required: true };

    const violations = collectViolations(raw, kind, rules);
    return violations.length ? { [SETTING_VIOLATIONS_KEY]: violations } : null;
  };
}

function collectViolations(
  raw: string,
  kind: SettingValueKind,
  rules: readonly SettingRule[],
): SettingViolation[] {
  const numeric = kind === 'minutes' || kind === 'money';
  const value = parseSettingInput(raw, kind);

  if (numeric && typeof value !== 'number') return [{ code: 'type', rule: {} }];
  if (kind === 'minutes' && !Number.isInteger(value)) return [{ code: 'whole_minutes', rule: {} }];

  return rules
    .filter((rule) => breaks(rule, raw, value))
    .map((rule) => ({ code: rule.type, rule: rule.params }));
}

function breaks(rule: SettingRule, raw: string, value: SettingValue | null): boolean {
  const p = rule.params;
  switch (rule.type) {
    case 'range':
      return typeof value === 'number' && outside(value, p['min'], p['max']);
    case 'scale':
      return typeof value === 'number' && decimals(raw) > Number(p['maxScale']);
    case 'length':
      return outside(raw.length, p['minLength'], p['maxLength']);
    case 'single_line':
      return /[\r\n]/.test(raw);
    default:
      return false;
  }
}

function outside(value: number, min: unknown, max: unknown): boolean {
  const lo = toNumber(min);
  const hi = toNumber(max);
  return (lo !== null && value < lo) || (hi !== null && value > hi);
}

function decimals(raw: string): number {
  const fraction = raw.trim().replace(',', '.').split('.')[1];
  return fraction ? fraction.length : 0;
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
