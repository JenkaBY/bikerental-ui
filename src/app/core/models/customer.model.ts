export interface CustomerRequest {
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthDate?: string;
  comments?: string;
}

export interface CustomerResponse {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
  email?: string;
  birthDate?: string;
  comments?: string;
}

export interface CustomerSearchResponse {
  id: string;
  phone: string;
  firstName: string;
  lastName: string;
}
