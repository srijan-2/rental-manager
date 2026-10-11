import { Payment, BillStatus } from '../types/payment';
import { parseISODate, toISODate } from './date';

export const OVERDUE_GRACE_DAYS = 5;

export function cycleEnded(bill: Payment, todayIso: string) {
  return todayIso >= bill.dueDate;
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
  if (!cycleEnded(bill, todayIso)) return 'In progress';
  if (!bill.electricity) return 'Calculation pending';
  const overdueDate = addDays(bill.dueDate, OVERDUE_GRACE_DAYS);
  return todayIso > overdueDate ? 'Overdue' : 'Due';
}

export function describeOutstanding(bill: Payment, todayIso: string) {
  const status = getBillStatus(bill, todayIso);
  const amounts = getBillAmounts(bill);
  if (status === 'In progress') return `Cycle running - ends ${formatShortDate(bill.cycleEnd)}`;
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
