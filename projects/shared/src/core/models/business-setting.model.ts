export type SettingValue = number | string;

export type SettingValueKind = 'minutes' | 'money' | 'text' | 'unknown';

export type SettingSource = 'POINT' | 'BUSINESS' | 'INSTALLATION_DEFAULT';

export type SettingLevel = 'POINT' | 'BUSINESS';

export type SettingChangeKind = 'SET' | 'RESET';

export interface SettingRule {
  readonly type: string;
  readonly params: Readonly<Record<string, unknown>>;
}

export interface SettingViolation {
  readonly code: string;
  readonly rule: Readonly<Record<string, unknown>>;
}

export interface BusinessSetting {
  readonly key: string;
  readonly description: string;
  readonly valueType: string;
  readonly kind: SettingValueKind;
  readonly unit: string | null;
  readonly rules: readonly SettingRule[];
  readonly permittedLevels: readonly SettingLevel[];
  readonly installationDefault: SettingValue | null;
  readonly businessValue: SettingValue | null;
  readonly effectiveValue: SettingValue | null;
  readonly effectiveSource: SettingSource;
  readonly version: number;
}

export interface BusinessSettingChangeWrite {
  readonly value: SettingValue;
  readonly expectedVersion: number;
}

export interface BusinessSettingChange {
  readonly id: string;
  readonly key: string;
  readonly description: string;
  readonly level: SettingLevel;
  readonly pointSlug: string | null;
  readonly valueType: string | null;
  readonly kind: SettingValueKind;
  readonly unit: string | null;
  readonly previousValue: SettingValue | null;
  readonly previousSource: SettingSource;
  readonly newValue: SettingValue | null;
  readonly newSource: SettingSource;
  readonly changeKind: SettingChangeKind;
  readonly changedBy: string;
  readonly changedAt: Date;
}

export interface BusinessSettingChangeFilter {
  readonly settingKey?: string;
  readonly from?: Date;
  readonly to?: Date;
}
