export type OccupancyStatus = 'Occupied' | 'Vacant';

export interface RentalUnit {
  id: string;
  unitNumber: string;
  tenantName: string;
  monthlyRent: number;
  status: OccupancyStatus;
  dueDate: string;
  securityDeposit?: number;
  moveInDate?: string;
  subMeterId?: string;
  prepaidElectricityBalance?: number;
}

export interface AddUnitFormValues {
  unitNumber: string;
  monthlyRent: string;
  tenantName: string;
  status: OccupancyStatus;
  securityDeposit: string;
  moveInDate: string;
}
