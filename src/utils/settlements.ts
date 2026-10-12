import { Payment } from '../types/payment';
import { Settlement } from '../types/settlement';
import { formatINR, roundMoney } from './currency';
import { parseISODate } from './date';

export type SettlementStatus = 'Settled' | 'Balance due' | 'Refund pending';

export function getSettlementStatus(settlement: Settlement): SettlementStatus {
  if (settlement.netAmount === 0 || settlement.paidDate) return 'Settled';
  return settlement.netAmount > 0 ? 'Balance due' : 'Refund pending';
}

export function getMoveOutRange(latestBill: Payment) {
  return { min: latestBill.cycleStart, max: latestBill.cycleEnd };
}

export function getProratedRent({
  rent,
  cycleStart,
  cycleEnd,
  moveOutDate,
}: {
  rent: number;
  cycleStart: string;
  cycleEnd: string;
  moveOutDate: string;
}) {
  if (moveOutDate === cycleEnd) return roundMoney(rent);
  const cycleDays = inclusiveDays(cycleStart, cycleEnd);
  const days = inclusiveDays(cycleStart, moveOutDate);
  return roundMoney((rent * days) / cycleDays);
}

export interface SettlementStatement {
  charges: { label: string; amount: number }[];
  credits: { label: string; amount: number }[];
  net: number;
}

export function buildSettlementStatement({
  unpaidBillsAmount,
  finalRent,
  finalElectricity,
  deductionAmount,
  deductionNote,
  advanceApplied,
  depositApplied,
}: {
  unpaidBillsAmount: number;
  finalRent: number;
  finalElectricity: number;
  deductionAmount: number;
  deductionNote?: string;
  advanceApplied: number;
  depositApplied: number;
}): SettlementStatement {
  const charges = [
    ...(unpaidBillsAmount > 0
      ? [{ label: 'Earlier unpaid bills', amount: roundMoney(unpaidBillsAmount) }]
      : []),
    { label: 'Final rent', amount: roundMoney(finalRent) },
    { label: 'Final electricity', amount: roundMoney(finalElectricity) },
    ...(deductionAmount > 0
      ? [
          {
            label: deductionNote?.trim() || 'Other deductions',
            amount: roundMoney(deductionAmount),
          },
        ]
      : []),
  ];
  const credits = [
    ...(advanceApplied > 0
      ? [{ label: 'Electricity advance applied', amount: roundMoney(advanceApplied) }]
      : []),
    ...(depositApplied > 0
      ? [{ label: 'Security deposit applied', amount: roundMoney(depositApplied) }]
      : []),
  ];
  const totalCharges = charges.reduce((sum, item) => sum + item.amount, 0);
  const totalCredits = credits.reduce((sum, item) => sum + item.amount, 0);
  return { charges, credits, net: roundMoney(totalCharges - totalCredits) };
}

export function getSettlementSummaryText(net: number) {
  if (net > 0) return `Tenant owes ${formatSettlementAmount(net)}`;
  if (net < 0) return `Refund ${formatSettlementAmount(Math.abs(net))} to tenant`;
  return 'Nothing due';
}

export function formatSettlementAmount(amount: number) {
  return formatINR(amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function inclusiveDays(start: string, end: string) {
  return Math.round((parseISODate(end).getTime() - parseISODate(start).getTime()) / 86400000) + 1;
}
