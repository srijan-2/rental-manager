export interface Tenant {
  id: string;
  name: string;
  phone: string;
  assignedUnit: string;
  monthlyRent: number;
  moveInDate: string;
}

export interface TenantFormValues {
  name: string;
  phone: string;
  assignedUnit: string;
  monthlyRent: string;
  moveInDate: string;
}
