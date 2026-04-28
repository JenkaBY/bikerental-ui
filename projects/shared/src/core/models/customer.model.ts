export interface Customer {
  readonly id: string;
  readonly phone: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email?: string;
  readonly birthDate?: Date;
  readonly notes?: string;
}

export interface CustomerWrite {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthDate?: Date;
  notes?: string;
}
