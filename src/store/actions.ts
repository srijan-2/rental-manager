import { Tenant } from '../types/tenant';
import { useTenantsStore } from './tenantsStore';
import { useUnitsStore } from './unitsStore';
import { usePaymentsStore } from './paymentsStore';
import { ensureBillSchedule } from './paymentSchedule';
import { todayISO } from '../utils/date';
import { useBuildingsStore } from './buildingsStore';
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
    lastMeterReading: data.openingMeterReading,
  });
  ensureBillSchedule();
  return tenant;
}
export function updateTenant(id: string, data: TenantData): Tenant {
  const current = useTenantsStore.getState().tenants.find((t) => t.id === id);
  if (!current) throw new Error('Tenant was not found');
  if (current.unitId !== data.unitId) {
    throw new Error(
      'Unit cannot be changed after adding a tenant. Remove the tenant and add them again.'
    );
  }
  ensureAvailable(current.unitId, id);
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
  useTenantsStore.getState().deleteTenant(id);
}

interface UnitDetails {
  buildingId: string;
  unitNumber: string;
  monthlyRent: number;
  securityDeposit?: number;
  subMeterId?: string;
}

function ensureUniqueUnit(unitId: string, buildingId: string, unitNumber: string) {
  const duplicate = useUnitsStore
    .getState()
    .units.find(
      (unit) =>
        unit.id !== unitId &&
        unit.buildingId === buildingId &&
        unit.unitNumber.trim().toLowerCase() === unitNumber.toLowerCase()
    );
  if (duplicate) {
    const building = useBuildingsStore.getState().getBuildingById(buildingId);
    throw new Error(
      `${unitNumber} already exists in ${building?.name ?? 'this building'}. If it is archived, restore it instead.`
    );
  }
}

export function updateUnitDetails(unitId: string, data: UnitDetails) {
  const unit = useUnitsStore.getState().units.find((item) => item.id === unitId);
  if (!unit) throw new Error('Unit was not found');
  const unitNumber = data.unitNumber.trim();
  if (!unitNumber) throw new Error('Unit number is required');
  if (!useBuildingsStore.getState().getBuildingById(data.buildingId))
    throw new Error('Building was not found');
  ensureUniqueUnit(unitId, data.buildingId, unitNumber);
  useUnitsStore.getState().updateUnit(unitId, {
    buildingId: data.buildingId,
    unitNumber,
    monthlyRent: data.monthlyRent,
    securityDeposit: data.securityDeposit,
    subMeterId: data.subMeterId?.trim() || undefined,
  });
}

export function deleteUnit(unitId: string) {
  const unit = useUnitsStore.getState().units.find((item) => item.id === unitId);
  if (!unit) throw new Error('Unit was not found');
  if (unit.tenantId) throw new Error('Remove the tenant first.');
  if (usePaymentsStore.getState().payments.some((payment) => payment.unitId === unitId))
    throw new Error('This unit has billing history. Archive it instead.');
  useUnitsStore.getState().deleteUnit(unitId);
}

export function archiveUnit(unitId: string) {
  const unit = useUnitsStore.getState().units.find((item) => item.id === unitId);
  if (!unit) throw new Error('Unit was not found');
  if (unit.tenantId) throw new Error('Remove the tenant first.');
  useUnitsStore.getState().updateUnit(unitId, { archivedAt: new Date().toISOString() });
}

export function restoreUnit(unitId: string) {
  const unit = useUnitsStore.getState().units.find((item) => item.id === unitId);
  if (!unit) throw new Error('Unit was not found');
  ensureUniqueUnit(unitId, unit.buildingId, unit.unitNumber.trim());
  useUnitsStore.getState().updateUnit(unitId, { archivedAt: undefined });
}

export function renameBuilding(id: string, name: string) {
  return useBuildingsStore.getState().updateBuilding(id, name);
}

export function deleteBuilding(id: string) {
  const count = useUnitsStore.getState().units.filter((unit) => unit.buildingId === id).length;
  if (count) throw new Error(`Move or delete its ${count} units first.`);
  useBuildingsStore.getState().deleteBuilding(id);
}
