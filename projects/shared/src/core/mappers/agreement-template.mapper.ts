import type {
  AgreementPdfPreviewRequest,
  AgreementTemplateRequest,
  AgreementTemplateResponse,
  AgreementTemplateSummaryResponse,
} from '@api-models';
import type {
  AgreementTemplate,
  AgreementTemplateSummary,
  AgreementTemplateWrite,
} from '../models/agreement-template.model';

export class AgreementTemplateMapper {
  static fromSummaryResponse(r: AgreementTemplateSummaryResponse): AgreementTemplateSummary {
    return {
      id: r.id ?? 0,
      versionNumber: r.versionNumber ?? undefined,
      title: r.title ?? '',
      status: r.status ?? 'DRAFT',
      createdAt: r.createdAt ? new Date(r.createdAt) : new Date(0),
      activatedAt: r.activatedAt ? new Date(r.activatedAt) : undefined,
      deactivatedAt: r.deactivatedAt ? new Date(r.deactivatedAt) : undefined,
    };
  }

  static fromResponse(r: AgreementTemplateResponse): AgreementTemplate {
    return {
      ...AgreementTemplateMapper.fromSummaryResponse(r),
      content: r.content ?? '',
    };
  }

  static toRequest(w: AgreementTemplateWrite): AgreementTemplateRequest {
    return {
      title: w.title,
      content: w.content,
    };
  }

  static toPreviewRequest(w: AgreementTemplateWrite): AgreementPdfPreviewRequest {
    return {
      title: w.title,
      content: w.content,
    };
  }
}
