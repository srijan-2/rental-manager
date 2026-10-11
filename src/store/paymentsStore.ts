import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Payment, PaymentMethod } from '../types/payment';
import { todayISO } from '../utils/date';
import { isReadingWindowOpen } from '../utils/payments';
import { useUnitsStore } from './unitsStore';

export interface ElectricityEntry {
  previousReading: number;
  currentReading: number;
  unitsConsumed: number;
  ratePerUnit: number;
  amount: number;
  recordedAt: string;
}

interface State {
  payments: Payment[];
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  updateRentAmounts: (tenantId: string, todayIso: string, amount: number) => void;
  markRentPaid: (id: string, method: PaymentMethod, date?: string) => void;
  markRentUnpaid: (id: string) => void;
  saveElectricity: (id: string, electricity: ElectricityEntry) => void;
  markElectricityPaid: (id: string, method: PaymentMethod, date?: string) => void;
  markElectricityUnpaid: (id: string) => void;
  markAllPaid: (id: string, method: PaymentMethod, date?: string) => void;
}

export const usePaymentsStore = create<State>()(
  persist(
    (set) => ({
      payments: [],
      addPayment: (payment) => set((s) => ({ payments: [payment, ...s.payments] })),
      updatePayment: (id, updates) =>
        set((s) => ({ payments: s.payments.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),
      deletePayment: (id) =>
        set((s) => ({ payments: s.payments.filter((payment) => payment.id !== id) })),
      updateRentAmounts: (tenantId, todayIso, amount) =>
        set((s) => ({
          payments: s.payments.map((payment) =>
            payment.tenantId === tenantId &&
            !payment.rentPaidDate &&
            !isReadingWindowOpen(payment, todayIso)
              ? { ...payment, rentAmount: amount }
              : payment
          ),
        })),
      markRentPaid: (id, method, date = todayISO()) =>
        set((s) => ({
          payments: s.payments.map((payment) =>
            payment.id === id ? { ...payment, rentPaidDate: date, rentMethod: method } : payment
          ),
        })),
      markRentUnpaid: (id) =>
        set((s) => ({
          payments: s.payments.map((payment) =>
            payment.id === id
              ? { ...payment, rentPaidDate: undefined, rentMethod: undefined }
              : payment
          ),
        })),
      saveElectricity: (id, electricity) => {
        set((s) => ({
          payments: s.payments.map((payment) =>
            payment.id === id ? { ...payment, electricity } : payment
          ),
        }));
        const payment = usePaymentsStore.getState().payments.find((item) => item.id === id);
        if (payment) {
          const hasLaterReading = usePaymentsStore
            .getState()
            .payments.some(
              (item) =>
                item.tenantId === payment.tenantId &&
                item.cycleStart > payment.cycleStart &&
                Boolean(item.electricity)
            );
          if (!hasLaterReading) {
            useUnitsStore.getState().updateUnit(payment.unitId, {
              lastMeterReading: electricity.currentReading,
            });
          }
        }
      },
      markElectricityPaid: (id, method, date = todayISO()) =>
        set((s) => ({
          payments: s.payments.map((payment) =>
            payment.id === id
              ? { ...payment, electricityPaidDate: date, electricityMethod: method }
              : payment
          ),
        })),
      markElectricityUnpaid: (id) =>
        set((s) => ({
          payments: s.payments.map((payment) =>
            payment.id === id
              ? { ...payment, electricityPaidDate: undefined, electricityMethod: undefined }
              : payment
          ),
        })),
      markAllPaid: (id, method, date = todayISO()) =>
        set((s) => ({
          payments: s.payments.map((payment) =>
            payment.id === id && payment.electricity
              ? {
                  ...payment,
                  rentPaidDate: date,
                  rentMethod: method,
                  electricityPaidDate: date,
                  electricityMethod: method,
                }
              : payment
          ),
        })),
    }),
    {
      name: 'rm-payments',
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (state, version) => (version < 4 ? { payments: [] } : state),
    }
  )
);
