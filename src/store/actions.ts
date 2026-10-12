import { Tenant } from '../types/tenant';
import { PaymentMethod } from '../types/payment';
import { Settlement } from '../types/settlement';
import { useTenantsStore } from './tenantsStore';
import { useUnitsStore } from './unitsStore';
import { usePaymentsStore } from './paymentsStore';
import { ensureBillSchedule } from './paymentSchedule';
import { todayISO } from '../utils/date';
import { parseISODate, toISODate } from '../utils/date';
import { buildSettlementStatement, getMoveOutRange, getProratedRent } from '../utils/settlements';
import { formatPeriodLabel, getBillAmounts } from '../utils/payments';
import { roundMoney } from '../utils/currency';
import { useBuildingsStore } from './buildingsStore';
import { useSettlementsStore } from './settlementsStore';
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

export interface MoveOutInput {
  tenantId: string;
  moveOutDate: string;
  finalReading: {
    previousReading: number;
    currentReading: number;
    ratePerUnit: number;
  };
  rentMode: 'prorated' | 'full' | 'custom';
  customRent?: number;
  deductionAmount: number;
  deductionNote?: string;
  advanceApplied: number;
  depositApplied: number;
  settleNow?: { method: Exclude<PaymentMethod, 'Settlement'> };
}

export function moveOutTenant(input: MoveOutInput): Settlement {
  const tenant = useTenantsStore.getState().tenants.find((item) => item.id === input.tenantId);
  if (!tenant) throw new Error('Tenant was not found.');
  const unit = useUnitsStore.getState().units.find((item) => item.id === tenant.unitId);
  if (!unit || unit.tenantId !== tenant.id) throw new Error('Tenant is not assigned to a unit.');
  const tenantBills = usePaymentsStore
    .getState()
    .payments.filter((bill) => bill.tenantId === tenant.id)
    .sort((a, b) => a.cycleStart.localeCompare(b.cycleStart));
  const finalBill = tenantBills[tenantBills.length - 1];
  if (!finalBill) throw new Error('This tenant has no billing cycle to settle.');
  const range = getMoveOutRange(finalBill);
  if (input.moveOutDate < range.min || input.moveOutDate > range.max) {
    throw new Error(`Move-out date must be between ${range.min} and ${range.max}.`);
  }
  if (tenantBills.slice(0, -1).some((bill) => !bill.electricity)) {
    throw new Error('Enter readings for all earlier billing cycles first.');
  }
  if (
    !Number.isFinite(input.finalReading.previousReading) ||
    !Number.isFinite(input.finalReading.currentReading) ||
    input.finalReading.previousReading < 0 ||
    input.finalReading.currentReading < input.finalReading.previousReading
  ) {
    throw new Error('Current reading cannot be less than previous reading.');
  }
  if (!Number.isFinite(input.finalReading.ratePerUnit) || input.finalReading.ratePerUnit <= 0) {
    throw new Error('Rate must be greater than 0.');
  }
  if (!Number.isFinite(input.deductionAmount) || input.deductionAmount < 0)
    throw new Error('Deduction amount must be a valid non-negative amount.');
  if (
    !Number.isFinite(input.advanceApplied) ||
    input.advanceApplied < 0 ||
    input.advanceApplied > tenant.electricityAdvance
  ) {
    throw new Error('Electricity advance applied cannot exceed the amount held.');
  }
  const depositHeld = unit.securityDeposit ?? 0;
  if (
    !Number.isFinite(input.depositApplied) ||
    input.depositApplied < 0 ||
    input.depositApplied > depositHeld
  ) {
    throw new Error('Security deposit applied cannot exceed the amount held.');
  }
  if (
    input.rentMode === 'custom' &&
    (!Number.isFinite(input.customRent) || input.customRent! < 0)
  ) {
    throw new Error('Custom rent must be a valid non-negative amount.');
  }

  const finalRent =
    input.rentMode === 'full'
      ? finalBill.rentAmount
      : input.rentMode === 'custom'
        ? input.customRent!
        : getProratedRent({
            rent: finalBill.rentAmount,
            cycleStart: finalBill.cycleStart,
            cycleEnd: finalBill.cycleEnd,
            moveOutDate: input.moveOutDate,
          });
  const unitsConsumed = roundMoney(
    input.finalReading.currentReading - input.finalReading.previousReading
  );
  const finalElectricity = roundMoney(unitsConsumed * input.finalReading.ratePerUnit);
  const unpaidBillsAmount = tenantBills
    .slice(0, -1)
    .reduce((sum, bill) => sum + getBillAmounts(bill).outstanding, 0);
  const statement = buildSettlementStatement({
    unpaidBillsAmount,
    finalRent,
    finalElectricity,
    deductionAmount: input.deductionAmount,
    deductionNote: input.deductionNote,
    advanceApplied: input.advanceApplied,
    depositApplied: input.depositApplied,
  });
  const settlementId = `settlement-${Date.now()}`;
  const settlement: Settlement = {
    id: settlementId,
    tenantId: tenant.id,
    tenantName: tenant.name,
    unitId: unit.id,
    moveOutDate: input.moveOutDate,
    billIds: tenantBills.map((bill) => bill.id),
    unpaidBillsAmount: roundMoney(unpaidBillsAmount),
    finalRent: roundMoney(finalRent),
    finalElectricity,
    deductionAmount: roundMoney(input.deductionAmount),
    deductionNote: input.deductionNote?.trim() || undefined,
    advanceApplied: roundMoney(input.advanceApplied),
    depositApplied: roundMoney(input.depositApplied),
    netAmount: statement.net,
    paidDate: input.settleNow && statement.net !== 0 ? todayISO() : undefined,
    method: input.settleNow && statement.net !== 0 ? input.settleNow.method : undefined,
    createdAt: new Date().toISOString(),
  };
  const finalUpdates = {
    cycleEnd: input.moveOutDate,
    dueDate: nextDate(input.moveOutDate),
    rentAmount: roundMoney(finalRent),
    periodLabel: formatPeriodLabel(finalBill.cycleStart, input.moveOutDate),
    isFinal: true,
    electricity: {
      previousReading: input.finalReading.previousReading,
      currentReading: input.finalReading.currentReading,
      unitsConsumed,
      ratePerUnit: input.finalReading.ratePerUnit,
      amount: finalElectricity,
      recordedAt: todayISO(),
    },
  };

  const paymentsStore = usePaymentsStore.getState();
  tenantBills.forEach((bill) => {
    const updates: Partial<typeof bill> = bill.id === finalBill.id ? finalUpdates : {};
    if (!bill.rentPaidDate) {
      updates.rentPaidDate = input.moveOutDate;
      updates.rentMethod = 'Settlement';
    }
    if (bill.electricity && !bill.electricityPaidDate) {
      updates.electricityPaidDate = input.moveOutDate;
      updates.electricityMethod = 'Settlement';
    }
    updates.settlementId = settlementId;
    paymentsStore.updatePayment(bill.id, updates);
  });
  useUnitsStore.getState().updateUnit(unit.id, {
    lastMeterReading: input.finalReading.currentReading,
    tenantId: undefined,
    status: 'Vacant',
  });
  useTenantsStore.getState().deleteTenant(tenant.id);
  useSettlementsStore.getState().addSettlement(settlement);
  return settlement;
}

function nextDate(isoDate: string) {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + 1);
  return toISODate(date);
}
