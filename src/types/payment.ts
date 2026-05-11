export type PaymentStatus = 'Paid' | 'Pending' | 'Overdue';

export interface Payment {
  id: string;
  tenantId: string;
  unitNumber: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: PaymentStatus;
  method: 'Bank Transfer' | 'Card' | 'Cash';
}
