import { BillStatus } from '../types/payment';

export function getStatusColors(status: BillStatus) {
  if (status === 'Paid') return { background: '#14532d66', text: '#86EFAC' };
  if (status === 'Overdue') return { background: '#7f1d1d66', text: '#FCA5A5' };
  if (status === 'Due') return { background: '#78350f66', text: '#FCD34D' };
  return { background: '#1e3a8a66', text: '#93C5FD' };
}
