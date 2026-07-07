import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { finalize, map, tap } from 'rxjs/operators';
import { AgreementsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { AgreementSignatureMapper } from '../mappers/agreement-signature.mapper';
import { AgreementTemplateMapper } from '../mappers/agreement-template.mapper';
import type { RentalAgreement } from '../models/agreement-template.model';
import type { SignatureCreated } from '../models/agreement-signature.model';

interface AgreementSigningState {
  template: RentalAgreement | null;
  isLoadingTemplate: boolean;
  isSigning: boolean;
}

@Injectable()
export class AgreementSigningStore {
  private readonly service = inject(AgreementsService);

  private readonly _state = signal<AgreementSigningState>({
    template: null,
    isLoadingTemplate: false,
    isSigning: false,
  });

  readonly template = computed(() => this._state().template);
  readonly isLoadingTemplate = computed(() => this._state().isLoadingTemplate);
  readonly isSigning = computed(() => this._state().isSigning);

  loadRentalAgreement(rentalId: number): Observable<RentalAgreement> {
    this._state.update((s) => ({ ...s, isLoadingTemplate: true }));
    return this.service
      .getRentalAgreement(rentalId, undefined, { context: suppressErrorNotification() })
      .pipe(
        map(AgreementTemplateMapper.fromRentalAgreementResponse),
        tap((template) => this._state.update((s) => ({ ...s, template }))),
        finalize(() => this._state.update((s) => ({ ...s, isLoadingTemplate: false }))),
      );
  }

  sign(
    rentalId: number,
    signaturePng: string,
    rentalVersion: number,
    operatorId: string,
  ): Observable<SignatureCreated> {
    const templateId = this._state().template?.templateId ?? 0;
    this._state.update((s) => ({ ...s, isSigning: true }));
    return this.service
      .sign(rentalId, { signaturePng, rentalVersion, templateId, operatorId }, undefined, {
        context: suppressErrorNotification(),
      })
      .pipe(
        map(AgreementSignatureMapper.fromCreatedResponse),
        finalize(() => this._state.update((s) => ({ ...s, isSigning: false }))),
      );
  }
}
