import { ElectricityUsageRecord } from '../types/electricityBill';

export const MOCK_ELECTRICITY_BILLS: ElectricityUsageRecord[] = [
  {
    id: 'eb-1',
    unitId: 'unit-101',
    unitNumber: 'Flat 101',
    monthLabel: 'March 2026',
    previousMeterReading: 12340,
    currentMeterReading: 12620,
    unitsConsumed: 280,
    ratePerUnit: 9,
    monthlyElectricityCharge: 2520,
    remainingPrepaidBalance: 2200,
    lowBalanceWarning: false,
    createdAt: '2026-03-30',
  },
  {
    id: 'eb-2',
    unitId: 'unit-302',
    unitNumber: 'Unit GF-2',
    monthLabel: 'April 2026',
    previousMeterReading: 12620,
    currentMeterReading: 12910,
    unitsConsumed: 290,
    ratePerUnit: 8,
    monthlyElectricityCharge: 2320,
    remainingPrepaidBalance: 780,
    lowBalanceWarning: false,
    createdAt: '2026-04-30',
  },
];
