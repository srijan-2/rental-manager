export type OccupancyStatus = 'Occupied' | 'Vacant';

export interface RentalUnit {
  id: string;
  buildingId: string;
  unitNumber: string;
  monthlyRent: number; // Default rent offered when assigning a tenant
  status: OccupancyStatus;
  securityDeposit?: number;
  subMeterId?: string;
  prepaidElectricityBalance?: number;
  tenantId?: string;
  notes?: string;
}

export interface AddUnitFormValues {
  buildingId: string;
  unitNumber: string;
  monthlyRent: string;
  securityDeposit: string;
  subMeterId: string;
  prepaidElectricityBalance: string;
}
