import { Payment } from '../types/payment';

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'p-1',
    tenantId: 't-1',
    unitNumber: 'Flat 101',
    amount: 18500,
    dueDate: '2026-05-10',
    paidDate: '2026-05-08',
    status: 'Paid',
    method: 'Bank Transfer',
  },
  {
    id: 'p-2',
    tenantId: 't-2',
    unitNumber: 'Flat 102',
    amount: 19200,
    dueDate: '2026-05-10',
    status: 'Pending',
    method: 'Card',
  },
  {
    id: 'p-3',
    tenantId: 't-3',
    unitNumber: 'Room 2A',
    amount: 12500,
    dueDate: '2026-05-05',
    status: 'Overdue',
    method: 'Cash',
  },
];
