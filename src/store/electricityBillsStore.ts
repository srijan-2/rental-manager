import { create } from 'zustand';
import { MOCK_ELECTRICITY_BILLS } from '../data/mockElectricityBills';
import { ElectricityUsageRecord } from '../types/electricityBill';

interface ElectricityBillsState {
  records: ElectricityUsageRecord[];
  addRecord: (record: ElectricityUsageRecord) => void;
  updateRecord: (recordId: string, updates: Partial<ElectricityUsageRecord>) => void;
  deleteRecord: (recordId: string) => void;
}

export const useElectricityBillsStore = create<ElectricityBillsState>((set) => ({
  records: MOCK_ELECTRICITY_BILLS,
  addRecord: (record) => set((state) => ({ records: [record, ...state.records] })),
  updateRecord: (recordId, updates) =>
    set((state) => ({
      records: state.records.map((record) =>
        record.id === recordId ? { ...record, ...updates } : record
      ),
    })),
  deleteRecord: (recordId) =>
    set((state) => ({
      records: state.records.filter((record) => record.id !== recordId),
    })),
}));
