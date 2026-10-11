import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ElectricityUsageRecord } from '../types/electricityBill';
interface State {
  records: ElectricityUsageRecord[];
  addRecord: (record: ElectricityUsageRecord) => void;
  updateRecord: (id: string, updates: Partial<ElectricityUsageRecord>) => void;
  deleteRecord: (id: string) => void;
}
export const useElectricityBillsStore = create<State>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (record) => set((s) => ({ records: [record, ...s.records] })),
      updateRecord: (id, updates) =>
        set((s) => ({ records: s.records.map((r) => (r.id === id ? { ...r, ...updates } : r)) })),
      deleteRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),
    }),
    {
      name: 'rm-electricity',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (state, version) => (version < 2 ? { records: [] } : state),
    }
  )
);
