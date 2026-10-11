import { Payment } from '../types/payment';
import { parseISODate, todayISO, toISODate } from '../utils/date';
import { addMonthsClamped, formatPeriodLabel } from '../utils/payments';
import { usePaymentsStore } from './paymentsStore';
import { useTenantsStore } from './tenantsStore';
import { useUnitsStore } from './unitsStore';

export function ensureBillSchedule(todayIso = todayISO()) {
  if (
    !useTenantsStore.persist.hasHydrated() ||
    !useUnitsStore.persist.hasHydrated() ||
    !usePaymentsStore.persist.hasHydrated()
  )
    return;

  const paymentsStore = usePaymentsStore.getState();
  const units = useUnitsStore.getState().units;
  useTenantsStore.getState().tenants.forEach((tenant) => {
    const unit = units.find((item) => item.id === tenant.unitId && item.tenantId === tenant.id);
    if (!unit || tenant.billingStartDate > todayIso) return;

    let cycleIndex = 0;
    let cycleStart = addMonthsClamped(tenant.billingStartDate, cycleIndex);
    while (cycleStart <= todayIso) {
      const nextCycleStart = addMonthsClamped(tenant.billingStartDate, cycleIndex + 1);
      const bill: Payment = {
        id: `bill-${Date.now()}-${tenant.id}-${cycleStart}`,
        tenantId: tenant.id,
        tenantName: tenant.name,
        unitId: unit.id,
        cycleStart,
        cycleEnd: subtractOneDay(nextCycleStart),
        dueDate: nextCycleStart,
        periodLabel: formatPeriodLabel(cycleStart, subtractOneDay(nextCycleStart)),
        rentAmount: tenant.monthlyRent,
        ...(cycleIndex === 0 ? { openingReading: tenant.openingMeterReading } : {}),
        createdAt: todayIso,
      };
      const existing = paymentsStore.payments.find(
        (payment) => payment.tenantId === tenant.id && payment.cycleStart === cycleStart
      );
      if (!existing) {
        paymentsStore.addPayment(bill);
      } else if (cycleIndex === 0 && existing.openingReading === undefined) {
        paymentsStore.updatePayment(existing.id, { openingReading: tenant.openingMeterReading });
      }
      cycleIndex += 1;
      cycleStart = addMonthsClamped(tenant.billingStartDate, cycleIndex);
    }
  });
}

function subtractOneDay(isoDate: string) {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() - 1);
  return toISODate(date);
}
