export interface CustomerSignupInput {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  phoneNo: string;
  email?: string;
  address?: string;
}

export interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  gender: 'male' | 'female';
  email: string | null;
  phoneNo: string;
  address: string | null;
  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
  countryCode: string | null;
  birthDate: string | null;
}

export type CustomerProfileInput = Partial<
  Pick<
    CustomerProfile,
    'firstName' | 'lastName' | 'email' | 'phoneNo' | 'gender' | 'birthDate' | 'address' | 'countryId' | 'stateId' | 'cityId' | 'countryCode'
  >
>;
