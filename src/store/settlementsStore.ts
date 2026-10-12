import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { todayISO } from '../utils/date';
import { Settlement } from '../types/settlement';
import { PaymentMethod } from '../types/payment';

type SettledMethod = Exclude<PaymentMethod, 'Settlement'>;

interface State {
  settlements: Settlement[];
  addSettlement: (settlement: Settlement) => void;
  markSettlementPaid: (id: string, method: SettledMethod, date?: string) => void;
  markSettlementUnpaid: (id: string) => void;
  markStatementSent: (id: string) => void;
  markPaidMessageSent: (id: string) => void;
}

export const useSettlementsStore = create<State>()(
  persist(
    (set) => ({
      settlements: [],
      addSettlement: (settlement) =>
        set((state) => ({ settlements: [settlement, ...state.settlements] })),
      markSettlementPaid: (id, method, date = todayISO()) =>
        set((state) => ({
          settlements: state.settlements.map((settlement) =>
            settlement.id === id ? { ...settlement, paidDate: date, method } : settlement
          ),
        })),
      markSettlementUnpaid: (id) =>
        set((state) => ({
          settlements: state.settlements.map((settlement) =>
            settlement.id === id
              ? { ...settlement, paidDate: undefined, method: undefined }
              : settlement
          ),
        })),
      markStatementSent: (id) =>
        set((state) => ({
          settlements: state.settlements.map((settlement) =>
            settlement.id === id
              ? { ...settlement, statementSentAt: new Date().toISOString() }
              : settlement
          ),
        })),
      markPaidMessageSent: (id) =>
        set((state) => ({
          settlements: state.settlements.map((settlement) =>
            settlement.id === id
              ? { ...settlement, paidMessageSentAt: new Date().toISOString() }
              : settlement
          ),
        })),
    }),
    {
      name: 'rm-settlements',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
