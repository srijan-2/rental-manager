import { Building } from '../types/building';
import { Payment } from '../types/payment';
import { Tenant } from '../types/tenant';
import { RentalUnit } from '../types/unit';
import { getBillAmounts, getBillStatus, getPaymentsSummary } from './payments';
import { parseISODate, toISODate } from './date';

interface DashboardInput {
  buildings: Building[];
  units: RentalUnit[];
  tenants: Tenant[];
  payments: Payment[];
}

export function getDashboardStats(
  { buildings, units, tenants, payments }: DashboardInput,
  todayIso: string
) {
  const tenantsById = new Map(tenants.map((tenant) => [tenant.id, tenant]));
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const buildingsById = new Map(buildings.map((building) => [building.id, building]));
  const activeUnits = units.filter((unit) => !unit.archivedAt);
  const occupiedUnits = activeUnits.filter((unit) =>
    Boolean(unit.tenantId && tenantsById.has(unit.tenantId))
  ).length;
  const validBills = payments.filter((bill) => {
    const unit = unitsById.get(bill.unitId);
    return Boolean(unit && tenantsById.has(bill.tenantId) && buildingsById.has(unit.buildingId));
  });
  const summary = getPaymentsSummary(validBills, todayIso);
  const readingsDue = validBills
    .filter((bill) => getBillStatus(bill, todayIso) === 'Calculation pending')
    .sort((a, b) => a.cycleStart.localeCompare(b.cycleStart));
  const billsToCollect = validBills
    .filter((bill) => {
      const status = getBillStatus(bill, todayIso);
      return (status === 'Overdue' || status === 'Due') && getBillAmounts(bill).outstanding > 0;
    })
    .sort((a, b) => {
      const statusOrder = { Overdue: 0, Due: 1 };
      const statusDifference =
        statusOrder[getBillStatus(a, todayIso) as 'Overdue' | 'Due'] -
        statusOrder[getBillStatus(b, todayIso) as 'Overdue' | 'Due'];
      return statusDifference || a.dueDate.localeCompare(b.dueDate);
    });
  const sevenDaysLater = addDays(todayIso, 7);
  const endingSoon = validBills
    .filter(
      (bill) =>
        getBillStatus(bill, todayIso) === 'In progress' &&
        bill.cycleEnd >= todayIso &&
        bill.cycleEnd <= sevenDaysLater
    )
    .map((bill) => ({ bill, daysLeft: daysBetween(todayIso, bill.cycleEnd) }))
    .sort((a, b) => a.bill.cycleEnd.localeCompare(b.bill.cycleEnd));
  const byBuilding = buildings
    .map((building) => {
      const buildingUnits = activeUnits.filter((unit) => unit.buildingId === building.id);
      const buildingUnitIds = new Set(buildingUnits.map((unit) => unit.id));
      const pendingToCollect = validBills
        .filter((bill) => buildingUnitIds.has(bill.unitId) && bill.electricity)
        .reduce((sum, bill) => sum + getBillAmounts(bill).outstanding, 0);
      return {
        building,
        totalUnits: buildingUnits.length,
        occupiedUnits: buildingUnits.filter((unit) =>
          Boolean(unit.tenantId && tenantsById.has(unit.tenantId))
        ).length,
        pendingToCollect,
      };
    })
    .sort((a, b) => a.building.name.localeCompare(b.building.name));

  return {
    totals: {
      totalUnits: activeUnits.length,
      occupiedUnits,
      vacantUnits: activeUnits.length - occupiedUnits,
      occupancyPercent: activeUnits.length
        ? Math.round((occupiedUnits / activeUnits.length) * 100)
        : 0,
      monthlyRentRoll: activeUnits.reduce((sum, unit) => {
        const tenant = unit.tenantId ? tenantsById.get(unit.tenantId) : undefined;
        return sum + (tenant?.monthlyRent ?? 0);
      }, 0),
    },
    summary,
    readingsDue,
    billsToCollect,
    endingSoon,
    byBuilding,
  };
}

export type DashboardStats = ReturnType<typeof getDashboardStats>;

function addDays(isoDate: string, days: number) {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function daysBetween(start: string, end: string) {
  return Math.round((parseISODate(end).getTime() - parseISODate(start).getTime()) / 86400000);
}
