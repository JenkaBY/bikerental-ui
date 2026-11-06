import type {
  SettingChangeRequest,
  SettingChangeResponse,
  SettingResetRequest,
  SettingRuleResponse,
  SettingViewResponse,
} from '@api-models';
import type {
  BusinessSetting,
  BusinessSettingChange,
  BusinessSettingChangeWrite,
  SettingRule,
  SettingValue,
  SettingValueKind,
  SettingViolation,
} from '../models/business-setting.model';

const KIND_BY_VALUE_TYPE: Record<string, SettingValueKind> = {
  MINUTES: 'minutes',
  MONEY: 'money',
  DATE_TIME_PATTERN: 'text',
  DATE_PATTERN: 'text',
  SINGLE_LINE_TEXT: 'text',
};

export class BusinessSettingMapper {
  static fromResponse(r: SettingViewResponse): BusinessSetting {
    return {
      key: r.key,
      description: r.description || r.key,
      valueType: r.valueType,
      kind: BusinessSettingMapper.kindOf(r.valueType),
      unit: r.unit ?? null,
      rules: (r.rules ?? []).map(BusinessSettingMapper.ruleFromResponse),
      permittedLevels: r.permittedLevels ?? [],
      installationDefault: BusinessSettingMapper.toValue(r.installationDefault),
      businessValue: BusinessSettingMapper.toValue(r.businessValue),
      effectiveValue: BusinessSettingMapper.toValue(r.effectiveValue),
      effectiveSource: r.effectiveSource,
      version: r.version ?? 0,
    };
  }

  static changeFromResponse(r: SettingChangeResponse): BusinessSettingChange {
    return {
      id: r.id,
      key: r.key,
      description: r.description || r.key,
      level: r.level,
      pointSlug: r.pointSlug ?? null,
      valueType: r.valueType ?? null,
      kind: BusinessSettingMapper.kindOf(r.valueType),
      unit: r.unit ?? null,
      previousValue: BusinessSettingMapper.toValue(r.previousValue),
      previousSource: r.previousSource,
      newValue: BusinessSettingMapper.toValue(r.newValue),
      newSource: r.newSource,
      changeKind: r.changeKind,
      changedBy: r.changedBy,
      changedAt: new Date(r.changedAt),
    };
  }

  static toChangeRequest(w: BusinessSettingChangeWrite): SettingChangeRequest {
    return {
      level: 'BUSINESS',
      value: String(w.value),
      expectedVersion: w.expectedVersion,
    };
  }

  static toResetRequest(expectedVersion: number): SettingResetRequest {
    return { level: 'BUSINESS', expectedVersion };
  }

  static violationsFromParams(params: Record<string, unknown>): SettingViolation[] {
    const raw = params['violations'];
    if (!Array.isArray(raw)) return [];
    return raw.filter(isRecord).map((v) => ({
      code: typeof v['code'] === 'string' ? v['code'] : '',
      rule: isRecord(v['rule']) ? v['rule'] : {},
    }));
  }

  private static ruleFromResponse(r: SettingRuleResponse): SettingRule {
    return { type: r.type, params: isRecord(r.params) ? r.params : {} };
  }

  private static kindOf(valueType: string | null | undefined): SettingValueKind {
    return (valueType && KIND_BY_VALUE_TYPE[valueType]) || 'unknown';
  }

  private static toValue(raw: unknown): SettingValue | null {
    if (raw === null || raw === undefined) return null;
    if (typeof raw === 'number' || typeof raw === 'string') return raw;
    return JSON.stringify(raw);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
