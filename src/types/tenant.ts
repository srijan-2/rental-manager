export interface Tenant {
  id: string;
  name: string;
  phone: string;
  unitId: string;
  monthlyRent: number;
  moveInDate: string;
}

export interface TenantFormValues {
  name: string;
  phone: string;
  unitId: string;
  monthlyRent: string;
  moveInDate: string;
}
