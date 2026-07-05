import type { SignatureCreatedResponse, SignatureSummaryResponse } from '@api-models';
import type { RentalSignatureSummary, SignatureCreated } from '../models/agreement-signature.model';

export class AgreementSignatureMapper {
  static fromCreatedResponse(r: SignatureCreatedResponse): SignatureCreated {
    return {
      signatureId: r.signatureId ?? 0,
      signedAt: r.signedAt ? new Date(r.signedAt) : new Date(0),
    };
  }

  static fromSummaryResponse(r: SignatureSummaryResponse): RentalSignatureSummary {
    return {
      signatureId: r.signatureId ?? 0,
      templateId: r.templateId ?? 0,
      templateVersionNumber: r.templateVersionNumber ?? 0,
      signedAt: r.signedAt ? new Date(r.signedAt) : new Date(0),
    };
  }
}
