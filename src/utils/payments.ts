import { Payment, BillStatus } from '../types/payment';
import { parseISODate, toISODate } from './date';

export const OVERDUE_GRACE_DAYS = 5;

export function getPaymentsSummary(payments: Payment[], todayIso: string) {
  const currentMonth = todayIso.slice(0, 7);
  return payments.reduce(
    (summary, bill) => {
      const amounts = getBillAmounts(bill);
      if (bill.electricity) summary.electricityToCollect += amounts.electricityDue;
      const status = getBillStatus(bill, todayIso);
      if (bill.electricity && status !== 'Paid') summary.pendingToCollect += amounts.outstanding;
      if (status === 'Calculation pending') {
        summary.awaitingCalculationCount += 1;
        summary.awaitingRent += amounts.rentDue;
      }
      if (status === 'Overdue') {
        summary.overdueCount += 1;
        summary.overdueAmount += amounts.outstanding;
      }
      if (bill.rentPaidDate?.slice(0, 7) === currentMonth) {
        summary.collectedThisMonth += bill.rentAmount;
      }
      if (bill.electricityPaidDate?.slice(0, 7) === currentMonth) {
        summary.collectedThisMonth += bill.electricity?.amount ?? 0;
      }
      return summary;
    },
    {
      pendingToCollect: 0,
      electricityToCollect: 0,
      awaitingCalculationCount: 0,
      awaitingRent: 0,
      overdueCount: 0,
      overdueAmount: 0,
      collectedThisMonth: 0,
    }
  );
}

export function isReadingWindowOpen(bill: Payment, todayIso: string) {
  return todayIso >= bill.cycleEnd;
}

export function getBillAmounts(bill: Payment) {
  const rentDue = bill.rentPaidDate ? 0 : bill.rentAmount;
  const electricityDue =
    !bill.electricity || bill.electricityPaidDate ? 0 : bill.electricity.amount;
  return {
    rentDue,
    electricityDue,
    outstanding: rentDue + electricityDue,
    totalBilled: bill.rentAmount + (bill.electricity?.amount ?? 0),
  };
}

export function getBillStatus(bill: Payment, todayIso: string): BillStatus {
  if (bill.rentPaidDate && bill.electricity && bill.electricityPaidDate) return 'Paid';
  if (!bill.electricity)
    return isReadingWindowOpen(bill, todayIso) ? 'Calculation pending' : 'In progress';
  const overdueDate = addDays(bill.dueDate, OVERDUE_GRACE_DAYS);
  return todayIso > overdueDate ? 'Overdue' : 'Due';
}

export function describeOutstanding(bill: Payment, todayIso: string) {
  const status = getBillStatus(bill, todayIso);
  const amounts = getBillAmounts(bill);
  if (status === 'In progress') {
    return `Cycle running - ends ${formatShortDate(bill.cycleEnd)}${
      bill.rentPaidDate ? ' (rent paid)' : ''
    }`;
  }
  if (!bill.electricity) {
    return bill.rentPaidDate
      ? 'Electricity pending (rent paid)'
      : `Rent ${formatINR(bill.rentAmount)} + electricity pending`;
  }
  if (amounts.outstanding === 0) return 'Paid in full';
  if (bill.rentPaidDate) return `${formatINR(amounts.electricityDue)} due (rent paid)`;
  if (bill.electricityPaidDate) return `${formatINR(amounts.rentDue)} due (electricity paid)`;
  return `${formatINR(amounts.outstanding)} due (rent ${formatINR(amounts.rentDue)} + electricity ${formatINR(amounts.electricityDue)})`;
}

export function addMonthsClamped(isoDate: string, months: number) {
  const original = parseISODate(isoDate);
  const targetMonth = new Date(original.getFullYear(), original.getMonth() + months, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  return toISODate(
    new Date(
      targetMonth.getFullYear(),
      targetMonth.getMonth(),
      Math.min(original.getDate(), lastDay)
    )
  );
}

export function formatPeriodLabel(start: string, end: string) {
  const monthYear = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(parseISODate(start));
  return `${monthYear} (${formatShortDate(start)} - ${formatShortDate(end)})`;
}

function addDays(isoDate: string, days: number) {
  const date = parseISODate(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function formatShortDate(isoDate: string) {
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short' }).format(
    parseISODate(isoDate)
  );
}

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
