import { Payment } from '../types/payment';
import { Tenant } from '../types/tenant';
import { isReadingWindowOpen } from './payments';

export function getReadingContext(bill: Payment, bills: Payment[], tenants: Tenant[]) {
  const previousBill = bills
    .filter((item) => item.tenantId === bill.tenantId && item.cycleStart < bill.cycleStart)
    .sort((a, b) => b.cycleStart.localeCompare(a.cycleStart))[0];
  const tenant = tenants.find((item) => item.id === bill.tenantId);
  const previousReading = previousBill
    ? (previousBill.electricity?.currentReading ?? null)
    : (bill.openingReading ?? tenant?.openingMeterReading ?? null);
  const initialRate =
    bills
      .filter((item) => item.unitId === bill.unitId && item.electricity)
      .sort((a, b) =>
        (b.electricity?.recordedAt ?? '').localeCompare(a.electricity?.recordedAt ?? '')
      )[0]?.electricity?.ratePerUnit ?? 0;
  return {
    previousReading,
    previousPeriodLabel: previousBill?.periodLabel,
    initialRate,
  };
}

export function canEditReading(bill: Payment, bills: Payment[], todayIso: string) {
  if (!isReadingWindowOpen(bill, todayIso) || bill.electricityPaidDate) return false;
  const nextBill = bills
    .filter((item) => item.tenantId === bill.tenantId && item.cycleStart > bill.cycleStart)
    .sort((a, b) => a.cycleStart.localeCompare(b.cycleStart))[0];
  return !nextBill?.electricity;
}
