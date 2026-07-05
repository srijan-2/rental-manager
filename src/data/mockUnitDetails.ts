import { UnitDetailsExtras } from '../types/unitDetails';

export const MOCK_UNIT_DETAILS: Record<string, UnitDetailsExtras> = {
  'unit-101': {
    unitId: 'unit-101',
    documents: [
      { id: 'd-1', name: 'Rent_Agreement_Flat101.pdf', type: 'rent-agreement', uploadedAt: '2025-07-10' },
      { id: 'd-2', name: 'Aadhaar_Arjun_Mehta.jpg', type: 'aadhaar', uploadedAt: '2025-07-10' },
    ],
    maintenanceRecords: [
      { id: 'm-1', title: 'Bathroom tap repair', description: 'Replaced washer and fixed leak', expense: 850, completedAt: '2026-02-14' },
      { id: 'm-2', title: 'AC service', description: 'Annual AC servicing and gas refill', expense: 2200, completedAt: '2026-04-02' },
    ],
    securityDeposit: {
      collected: 37000,
      refundStatus: 'Held',
      notes: '2 months rent equivalent held as deposit',
    },
    notes: 'Tenant prefers UPI for rent payments. Gate pass issued for 2-wheeler.',
  },
  'unit-102': {
    unitId: 'unit-102',
    documents: [
      { id: 'd-3', name: 'Rent_Agreement_Flat102.pdf', type: 'rent-agreement', uploadedAt: '2024-11-01' },
      { id: 'd-4', name: 'PAN_Nisha_Kapoor.jpg', type: 'pan', uploadedAt: '2024-11-01' },
    ],
    maintenanceRecords: [
      { id: 'm-3', title: 'Kitchen chimney cleaning', description: 'Deep clean and filter replacement', expense: 1200, completedAt: '2026-01-20' },
    ],
    securityDeposit: {
      collected: 38400,
      refundStatus: 'Held',
    },
    notes: 'Rent due on 10th of every month.',
  },
  'unit-201': {
    unitId: 'unit-201',
    documents: [
      { id: 'd-5', name: 'Rent_Agreement_Room2A.pdf', type: 'rent-agreement', uploadedAt: '2026-01-05' },
    ],
    maintenanceRecords: [],
    securityDeposit: {
      collected: 25000,
      refundStatus: 'Held',
    },
    notes: 'New tenant. First rent collection pending.',
  },
};

export function getUnitDetailsExtras(unitId: string): UnitDetailsExtras {
  return (
    MOCK_UNIT_DETAILS[unitId] ?? {
      unitId,
      documents: [],
      maintenanceRecords: [],
      securityDeposit: {
        collected: 0,
        refundStatus: 'Not Applicable',
      },
      notes: '',
    }
  );
}
