import { Tenant } from '../types/tenant';

export const MOCK_TENANTS: Tenant[] = [
  { id: 't-1', name: 'Arjun Mehta', phone: '+91 98765 43210', assignedUnit: 'Flat 101', monthlyRent: 18500, moveInDate: '2025-07-12' },
  { id: 't-2', name: 'Nisha Kapoor', phone: '+91 97654 32109', assignedUnit: 'Flat 102', monthlyRent: 19200, moveInDate: '2024-11-03' },
  { id: 't-3', name: 'Rohan Iyer', phone: '+91 96543 21098', assignedUnit: 'Room 2A', monthlyRent: 12500, moveInDate: '2026-01-08' },
  { id: 't-4', name: 'Kavya Nair', phone: '+91 95432 10987', assignedUnit: 'Room 2B', monthlyRent: 12200, moveInDate: '2025-03-19' },
  { id: 't-5', name: 'Siddharth Rao', phone: '+91 94321 09876', assignedUnit: 'Unit GF-1', monthlyRent: 21000, moveInDate: '2025-09-01' },
  { id: 't-6', name: 'Priya Sharma', phone: '+91 93210 98765', assignedUnit: 'Unit GF-2', monthlyRent: 20500, moveInDate: '2024-05-22' },
];
