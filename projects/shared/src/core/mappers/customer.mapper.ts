import type { CustomerRequest, CustomerResponse } from '@api-models';
import { type Customer, type CustomerWrite } from '@ui-models';

export class CustomerMapper {
  static fromResponse(r: CustomerResponse): Customer {
    return {
      id: r.id,
      phone: r.phone,
      firstName: r.firstName ?? '',
      lastName: r.lastName ?? '',
      email: r.email,
      birthDate: r.birthDate ? new Date(r.birthDate) : undefined,
      notes: r.comments,
    };
  }

  static toRequest(w: CustomerWrite): CustomerRequest {
    return {
      phone: w.phone,
      firstName: w.firstName,
      lastName: w.lastName,
      email: w.email,
      birthDate: w.birthDate,
      comments: w.notes,
    };
  }
}
