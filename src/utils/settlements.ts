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
  charges: { label: string; detail?: string; amount: number }[];
  credits: { label: string; detail?: string; amount: number }[];
  totalCharges: number;
  totalCredits: number;
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
  finalRentDetail,
  finalElectricityDetail,
}: {
  unpaidBillsAmount: number;
  finalRent: number;
  finalElectricity: number;
  deductionAmount: number;
  deductionNote?: string;
  advanceApplied: number;
  depositApplied: number;
  finalRentDetail?: string;
  finalElectricityDetail?: string;
}): SettlementStatement {
  const charges = [
    ...(unpaidBillsAmount > 0
      ? [{ label: 'Earlier unpaid bills', amount: roundMoney(unpaidBillsAmount) }]
      : []),
    { label: 'Rent', detail: finalRentDetail, amount: roundMoney(finalRent) },
    { label: 'Electricity', detail: finalElectricityDetail, amount: roundMoney(finalElectricity) },
    ...(deductionAmount > 0
      ? [
          {
            label: 'Deductions',
            detail: deductionNote?.trim(),
            amount: roundMoney(deductionAmount),
          },
        ]
      : []),
  ];
  const credits = [
    { label: 'Electricity advance', detail: 'held', amount: roundMoney(advanceApplied) },
    { label: 'Security deposit', detail: 'held', amount: roundMoney(depositApplied) },
  ];
  const totalCharges = charges.reduce((sum, item) => sum + item.amount, 0);
  const totalCredits = credits.reduce((sum, item) => sum + item.amount, 0);
  return {
    charges,
    credits,
    totalCharges,
    totalCredits,
    net: roundMoney(totalCharges - totalCredits),
  };
}

export function settlementToStatement(settlement: Settlement): SettlementStatement {
  return buildSettlementStatement({
    unpaidBillsAmount: settlement.unpaidBillsAmount,
    finalRent: settlement.finalRent,
    finalElectricity: settlement.finalElectricity,
    deductionAmount: settlement.deductionAmount,
    deductionNote: settlement.deductionNote,
    advanceApplied: settlement.advanceApplied,
    depositApplied: settlement.depositApplied,
    finalRentDetail: settlement.finalRentDetail,
    finalElectricityDetail: settlement.finalElectricityDetail,
  });
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
