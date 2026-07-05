export interface UnitDocument {
  id: string;
  name: string;
  type: 'rent-agreement' | 'aadhaar' | 'pan' | 'other';
  uploadedAt: string;
}

export interface MaintenanceRecord {
  id: string;
  title: string;
  description: string;
  expense: number;
  completedAt: string;
}

export interface SecurityDepositInfo {
  collected: number;
  refundStatus: 'Held' | 'Partial Refund' | 'Fully Refunded' | 'Not Applicable';
  refundAmount?: number;
  refundDate?: string;
  notes?: string;
}

export interface UnitDetailsExtras {
  unitId: string;
  documents: UnitDocument[];
  maintenanceRecords: MaintenanceRecord[];
  securityDeposit: SecurityDepositInfo;
  notes: string;
}
