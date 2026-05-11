import { create } from 'zustand';
import { MOCK_TENANTS } from '../data/mockTenants';
import { Tenant } from '../types/tenant';

interface TenantsState {
  tenants: Tenant[];
  addTenant: (tenant: Tenant) => void;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => void;
  deleteTenant: (tenantId: string) => void;
}

export const useTenantsStore = create<TenantsState>((set) => ({
  tenants: MOCK_TENANTS,
  addTenant: (tenant) =>
    set((state) => ({
      tenants: [tenant, ...state.tenants],
    })),
  updateTenant: (tenantId, updates) =>
    set((state) => ({
      tenants: state.tenants.map((tenant) =>
        tenant.id === tenantId ? { ...tenant, ...updates } : tenant
      ),
    })),
  deleteTenant: (tenantId) =>
    set((state) => ({
      tenants: state.tenants.filter((tenant) => tenant.id !== tenantId),
    })),
}));
