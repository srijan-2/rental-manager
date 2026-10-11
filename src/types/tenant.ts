export interface Tenant {
  id: string;
  name: string;
  phone: string;
  unitId: string;
  monthlyRent: number; // Source of truth for an occupied unit's rent
  moveInDate: string;
  electricityAdvance: number;
  openingMeterReading: number;
  billingStartDate: string;
}

export interface TenantFormValues {
  name: string;
  phone: string;
  unitId: string;
  monthlyRent: string;
  moveInDate: string;
  electricityAdvance: string;
  openingMeterReading: string;
  billingStartDate: string;
}
