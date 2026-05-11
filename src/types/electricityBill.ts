export interface ElectricityUsageRecord {
  id: string;
  unitId: string;
  unitNumber: string;
  monthLabel: string;
  previousMeterReading: number;
  currentMeterReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  monthlyElectricityCharge: number;
  remainingPrepaidBalance: number;
  lowBalanceWarning: boolean;
  createdAt: string;
}

export interface ElectricityRecordFormValues {
  unitId: string;
  monthLabel: string;
  previousMeterReading: string;
  currentMeterReading: string;
  ratePerUnit: string;
}
