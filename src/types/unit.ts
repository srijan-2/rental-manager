export type OccupancyStatus = 'Occupied' | 'Vacant';

export interface RentalUnit {
  id: string;
  buildingId: string;
  unitNumber: string;
  monthlyRent: number;
  status: OccupancyStatus;
  securityDeposit?: number;
  subMeterId?: string;
  prepaidElectricityBalance?: number;
  tenantId?: string;
}

export interface AddUnitFormValues {
  buildingId: string;
  unitNumber: string;
  monthlyRent: string;
  securityDeposit: string;
  subMeterId: string;
  prepaidElectricityBalance: string;
}
