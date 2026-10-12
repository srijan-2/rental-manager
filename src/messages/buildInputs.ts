import { Building } from '../types/building';
import { Payment } from '../types/payment';
import { Tenant } from '../types/tenant';
import { RentalUnit } from '../types/unit';
import { addMonthsClamped } from '../utils/payments';
import { getBillAmounts } from '../utils/payments';
import { Settlement } from '../types/settlement';

export function buildBillInput(
  bill: Payment,
  tenant: Tenant,
  unit: RentalUnit,
  building: Building,
  today: string
) {
  if (!bill.electricity) return null;
  return {
    tenantName: tenant.name,
    buildingName: building.name,
    unitNumber: unit.unitNumber,
    periodLabel: bill.periodLabel,
    rentAmount: bill.rentAmount,
    electricity: bill.electricity,
    rentPaid: Boolean(bill.rentPaidDate),
    electricityPaid: Boolean(bill.electricityPaidDate),
    dueDate: bill.dueDate,
    today,
  };
}

export function buildWelcomeInput(
  tenant: Tenant,
  unit: RentalUnit,
  building: Building,
  payments: Payment[]
) {
  const firstBill = payments
    .filter((bill) => bill.tenantId === tenant.id)
    .sort((a, b) => a.cycleStart.localeCompare(b.cycleStart))[0];
  return {
    tenantName: tenant.name,
    buildingName: building.name,
    unitNumber: unit.unitNumber,
    monthlyRent: tenant.monthlyRent,
    moveInDate: tenant.moveInDate,
    billingStartDate: tenant.billingStartDate,
    firstDueDate: firstBill?.dueDate ?? addMonthsClamped(tenant.billingStartDate, 1),
    electricityAdvance: tenant.electricityAdvance,
    securityDeposit: unit.securityDeposit ?? 0,
    openingMeterReading: tenant.openingMeterReading,
  };
}

export function buildReceiptInput(
  bill: Payment,
  tenant: Tenant,
  unit: RentalUnit,
  building: Building,
  components: ('rent' | 'electricity')[]
) {
  const covered: {
    kind: 'rent' | 'electricity';
    amount: number;
    paidDate: string;
    method: string;
  }[] = [];

  for (const kind of components) {
    if (kind === 'rent' && bill.rentPaidDate && bill.rentMethod !== 'Settlement') {
      covered.push({
        kind,
        amount: bill.rentAmount,
        paidDate: bill.rentPaidDate,
        method: bill.rentMethod ?? 'Cash',
      });
    }
    if (
      kind === 'electricity' &&
      bill.electricity &&
      bill.electricityPaidDate &&
      bill.electricityMethod !== 'Settlement'
    ) {
      covered.push({
        kind,
        amount: bill.electricity.amount,
        paidDate: bill.electricityPaidDate,
        method: bill.electricityMethod ?? 'Cash',
      });
    }
  }
  if (!covered.length) return null;
  return {
    tenantName: tenant.name,
    buildingName: building.name,
    unitNumber: unit.unitNumber,
    periodLabel: bill.periodLabel,
    covered,
    outstanding: getBillAmounts(bill).outstanding,
    electricityRecorded: Boolean(bill.electricity),
  };
}

export function buildReminderInput(
  bill: Payment,
  tenant: Tenant,
  unit: RentalUnit,
  building: Building,
  today: string,
  overdue: boolean
) {
  const amounts = getBillAmounts(bill);
  return {
    tenantName: tenant.name,
    buildingName: building.name,
    unitNumber: unit.unitNumber,
    periodLabel: bill.periodLabel,
    rentDue: amounts.rentDue,
    electricityDue: amounts.electricityDue,
    outstanding: amounts.outstanding,
    dueDate: bill.dueDate,
    today,
    overdue,
  };
}

export function buildSettlementInput(settlement: Settlement, unit: RentalUnit, building: Building) {
  return {
    tenantName: settlement.tenantName,
    buildingName: building.name,
    unitNumber: unit.unitNumber,
    moveOutDate: settlement.moveOutDate,
    finalRent: settlement.finalRent,
    finalElectricity: settlement.finalElectricity,
    unpaidBillsAmount: settlement.unpaidBillsAmount,
    deductionAmount: settlement.deductionAmount,
    deductionNote: settlement.deductionNote,
    advanceApplied: settlement.advanceApplied,
    depositApplied: settlement.depositApplied,
    netAmount: settlement.netAmount,
  };
}

export function buildSettlementPaidInput(
  settlement: Settlement,
  unit: RentalUnit,
  building: Building
) {
  if (!settlement.paidDate || !settlement.method || settlement.netAmount === 0) return null;
  return {
    tenantName: settlement.tenantName,
    buildingName: building.name,
    unitNumber: unit.unitNumber,
    amount: Math.abs(settlement.netAmount),
    direction: settlement.netAmount > 0 ? ('received' as const) : ('refunded' as const),
    paidDate: settlement.paidDate,
    method: settlement.method,
  };
}
