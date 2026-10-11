export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Card';
export type BillStatus = 'Paid' | 'In progress' | 'Calculation pending' | 'Overdue' | 'Due';

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  cycleStart: string;
  cycleEnd: string;
  dueDate: string;
  periodLabel: string;
  rentAmount: number;
  openingReading?: number;
  rentPaidDate?: string;
  rentMethod?: PaymentMethod;
  electricity?: {
    previousReading: number;
    currentReading: number;
    unitsConsumed: number;
    ratePerUnit: number;
    amount: number;
    recordedAt: string;
  };
  electricityPaidDate?: string;
  electricityMethod?: PaymentMethod;
  createdAt: string;
}
