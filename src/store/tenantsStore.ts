import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { Tenant } from '../types/tenant';
interface State {
  tenants: Tenant[];
  addTenant: (tenant: Tenant) => void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
}
export const useTenantsStore = create<State>()(
  persist(
    (set) => ({
      tenants: [],
      addTenant: (tenant) => set((s) => ({ tenants: [tenant, ...s.tenants] })),
      updateTenant: (id, updates) =>
        set((s) => ({ tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),
      deleteTenant: (id) => set((s) => ({ tenants: s.tenants.filter((t) => t.id !== id) })),
    }),
    {
      name: 'rm-tenants',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      migrate: (state, version) => (version < 2 ? { tenants: [] } : state),
    }
  )
);
