import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Tenant } from '../types/tenant';
interface State {
  tenants: Tenant[];
  addTenant: (tenant: Tenant) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  markWelcomeSent: (id: string) => void;
  updateMessageLanguage: (id: string, language: 'hi' | 'en') => void;
}
export const useTenantsStore = create<State>()(
  persist(
    (set) => ({
      tenants: [],
      addTenant: (tenant) => set((s) => ({ tenants: [tenant, ...s.tenants] })),
      updateTenant: (id, updates) =>
        set((s) => ({ tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteTenant: (id) => set((s) => ({ tenants: s.tenants.filter((t) => t.id !== id) })),
      markWelcomeSent: (id) =>
        set((s) => ({
          tenants: s.tenants.map((tenant) =>
            tenant.id === id ? { ...tenant, welcomeSentAt: new Date().toISOString() } : tenant
          ),
        })),
      updateMessageLanguage: (id, language) =>
        set((s) => ({
          tenants: s.tenants.map((tenant) =>
            tenant.id === id ? { ...tenant, messageLanguage: language } : tenant
          ),
        })),
    }),
    {
      name: 'rm-tenants',
      version: 4,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (state, version) => {
        if (version >= 4) return state;
        const persisted = state as Record<string, unknown> & {
          tenants?: Array<
            Omit<Tenant, 'electricityAdvance' | 'openingMeterReading' | 'billingStartDate'> &
              Partial<
                Pick<Tenant, 'electricityAdvance' | 'openingMeterReading' | 'billingStartDate'>
              >
          >;
        };
        const migrated = {
          ...persisted,
          tenants: (persisted.tenants ?? []).map((tenant) => ({
            ...tenant,
            electricityAdvance: tenant.electricityAdvance ?? 0,
            openingMeterReading: tenant.openingMeterReading ?? 0,
            billingStartDate: tenant.billingStartDate ?? tenant.moveInDate,
            messageLanguage: tenant.messageLanguage ?? 'hi',
          })),
        };
        return migrated;
      },
    }
  )
);
