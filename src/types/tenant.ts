export interface Tenant {
  id: string;
  name: string;
  phone: string;
  unitId: string;
  monthlyRent: number; // Source of truth for an occupied unit's rent
  moveInDate: string;
}

export interface TenantFormValues {
  name: string;
  phone: string;
  unitId: string;
  monthlyRent: string;
  moveInDate: string;
}
