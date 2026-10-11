import { Tenant } from '../types/tenant';
import { useTenantsStore } from './tenantsStore';
import { useUnitsStore } from './unitsStore';
import { usePaymentsStore } from './paymentsStore';
import { ensureBillSchedule } from './paymentSchedule';
import { todayISO } from '../utils/date';
type TenantData = Omit<Tenant, 'id'>;
function ensureAvailable(unitId: string, tenantId?: string) {
  const unit = useUnitsStore.getState().units.find((item) => item.id === unitId);
  if (!unit) throw new Error('Selected unit was not found');
  if (unit.tenantId && unit.tenantId !== tenantId)
    throw new Error('That unit already has an active tenant');
  return unit;
}
export function assignTenant(data: TenantData): Tenant {
  const unit = ensureAvailable(data.unitId);
  const tenant = { ...data, id: `tenant-${Date.now()}` };
  useTenantsStore.getState().addTenant(tenant);
  useUnitsStore.getState().updateUnit(unit.id, {
    status: 'Occupied',
    tenantId: tenant.id,
    prepaidElectricityBalance: data.electricityAdvance,
    lastMeterReading: data.openingMeterReading,
  });
  ensureBillSchedule();
  return tenant;
}
export function updateTenant(id: string, data: TenantData): Tenant {
  const current = useTenantsStore.getState().tenants.find((t) => t.id === id);
  if (!current) throw new Error('Tenant was not found');
  ensureAvailable(data.unitId, id);
  if (current.unitId !== data.unitId) {
    useUnitsStore.getState().updateUnit(current.unitId, { status: 'Vacant', tenantId: undefined });
    useUnitsStore.getState().updateUnit(data.unitId, { status: 'Occupied', tenantId: id });
  }
  const tenant = {
    ...data,
    id,
    electricityAdvance: current.electricityAdvance,
    openingMeterReading: current.openingMeterReading,
    billingStartDate: current.billingStartDate,
  };
  useTenantsStore.getState().updateTenant(id, tenant);
  usePaymentsStore.getState().updateRentAmounts(id, todayISO(), data.monthlyRent);
  ensureBillSchedule();
  return tenant;
}
export function removeTenant(id: string) {
  const tenant = useTenantsStore.getState().tenants.find((t) => t.id === id);
  if (!tenant) return;
  useUnitsStore.getState().updateUnit(tenant.unitId, { status: 'Vacant', tenantId: undefined });
  usePaymentsStore
    .getState()
    .deletePaymentsWhere(
      (payment) => !payment.rentPaidDate && !payment.electricity && payment.tenantId === id
    );
  useTenantsStore.getState().deleteTenant(id);
}
