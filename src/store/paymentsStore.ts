import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Payment } from '../types/payment';
interface State {
  payments: Payment[];
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
}
export const usePaymentsStore = create<State>()(
  persist(
    (set) => ({
      payments: [],
      addPayment: (payment) => set((s) => ({ payments: [payment, ...s.payments] })),
      updatePayment: (id, updates) =>
        set((s) => ({ payments: s.payments.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      deletePayment: (id) => set((s) => ({ payments: s.payments.filter((p) => p.id !== id) })),
    }),
    {
      name: 'rm-payments',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (state, version) => (version < 2 ? { payments: [] } : state),
    }
  )
);
