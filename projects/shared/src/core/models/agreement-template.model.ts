export type AgreementTemplateStatus = 'DRAFT' | 'ACTIVE' | 'DEACTIVATED';

export interface AgreementTemplateSummary {
  readonly id: number;
  readonly versionNumber?: number;
  readonly title: string;
  readonly status: AgreementTemplateStatus;
  readonly createdAt: Date;
  readonly activatedAt?: Date;
  readonly deactivatedAt?: Date;
}

export interface AgreementTemplate extends AgreementTemplateSummary {
  readonly content: string;
}

export interface AgreementTemplateWrite {
  title: string;
  content: string;
}

export interface AgreementTemplateVariable {
  readonly key: string;
  readonly description: string;
  readonly example?: string;
}

export interface RentalAgreement {
  readonly templateId: number;
  readonly versionNumber?: number;
  readonly title: string;
  readonly content: string;
}
