export type SettingValue = number | string;

export type SettingValueKind = 'minutes' | 'money' | 'text' | 'geoLocation' | 'unknown';

export type SettingSource =
  | 'POINT'
  | 'BUSINESS'
  | 'DERIVED'
  | 'INSTALLATION_DEFAULT'
  | 'NOT_DECLARED';

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

export interface SettingPointValue {
  readonly pointSlug: string;
  readonly value: SettingValue | null;
  readonly version: number;
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
  readonly pointValues: readonly SettingPointValue[];
}

export interface BusinessSettingChangeWrite {
  readonly value: SettingValue;
  readonly expectedVersion: number;
  readonly pointSlug?: string;
}

export interface BusinessSettingResetWrite {
  readonly expectedVersion: number;
  readonly pointSlug?: string;
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
