import type { SignatureCreatedResponse } from '@api-models';
import type { SignatureCreated } from '../models/agreement-signature.model';

export class AgreementSignatureMapper {
  static fromCreatedResponse(r: SignatureCreatedResponse): SignatureCreated {
    return {
      signatureId: r.signatureId ?? 0,
      signedAt: r.signedAt ? new Date(r.signedAt) : new Date(0),
    };
  }
}
